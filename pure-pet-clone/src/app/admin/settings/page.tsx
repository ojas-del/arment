'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

interface ThemeSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  created_at: string;
}

interface ShippingRate {
  id: string;
  zone_id: string;
  name: string;
  min_weight: number;
  max_weight: number;
  min_order_value: number;
  max_order_value: number;
  price: number;
  is_free_above: number | null;
  is_active: boolean;
}

interface AnalyticsPixel {
  id: string;
  name: string;
  type: string;
  pixel_id: string;
  script_head: string;
  script_body: string;
  is_active: boolean;
}

interface Menu {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  menu_id: string;
  label: string;
  url: string;
  parent_id: string | null;
  sort_order: number;
}

type TabId = 'general' | 'theme' | 'shipping' | 'analytics' | 'menus';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'theme', label: 'Theme', icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
  { id: 'shipping', label: 'Shipping', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { id: 'analytics', label: 'Analytics', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  { id: 'menus', label: 'Menus', icon: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' },
];

const PIXEL_TYPES = ['Google Analytics', 'Facebook Pixel', 'Google Tag Manager', 'TikTok Pixel', 'Hotjar', 'Custom'];
const MENU_LOCATIONS = ['header', 'footer', 'sidebar', 'mobile'];

const GENERAL_FIELDS = [
  { key: 'store_name', label: 'Store Name', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'email', label: 'Contact Email', type: 'email' },
  { key: 'phone', label: 'Phone Number', type: 'tel' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'logo_url', label: 'Logo URL', type: 'url' },
  { key: 'favicon_url', label: 'Favicon URL', type: 'url' },
];

const THEME_FIELDS = [
  { key: 'primary_color', label: 'Primary Color', type: 'color' },
  { key: 'secondary_color', label: 'Secondary Color', type: 'color' },
  { key: 'accent_color', label: 'Accent Color', type: 'color' },
  { key: 'font_family', label: 'Font Family', type: 'text' },
  { key: 'header_style', label: 'Header Style', type: 'select', options: ['default', 'transparent', 'sticky', 'centered'] },
  { key: 'footer_style', label: 'Footer Style', type: 'select', options: ['default', 'minimal', 'expanded', 'centered'] },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // General
  const [generalSettings, setGeneralSettings] = useState<Record<string, string>>({});
  const [generalLoading, setGeneralLoading] = useState(true);
  const [generalSaving, setGeneralSaving] = useState(false);

  // Theme
  const [themeSettings, setThemeSettings] = useState<Record<string, string>>({});
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeSaving, setThemeSaving] = useState(false);

  // Shipping
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', regions: '' });
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [rateForm, setRateForm] = useState({ zone_id: '', name: '', min_weight: 0, max_weight: 0, min_order_value: 0, max_order_value: 0, price: 0, is_free_above: '', is_active: true });
  const [showRateForm, setShowRateForm] = useState(false);

  // Analytics
  const [pixels, setPixels] = useState<AnalyticsPixel[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsSaving, setAnalyticsSaving] = useState(false);
  const [editingPixel, setEditingPixel] = useState<AnalyticsPixel | null>(null);
  const [pixelForm, setPixelForm] = useState({ name: '', type: 'Google Analytics', pixel_id: '', script_head: '', script_body: '', is_active: true });
  const [showPixelForm, setShowPixelForm] = useState(false);

  // Menus
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [menusSaving, setMenusSaving] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', location: 'header' });
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemForm, setMenuItemForm] = useState({ label: '', url: '', parent_id: '', sort_order: 0 });
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);

  // ─── Auto-clear success ────────────────────────────────────────────────────

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ─── General Settings ─────────────────────────────────────────────────────

  const fetchGeneralSettings = useCallback(async () => {
    setGeneralLoading(true);
    try {
      const { data, error: err } = await supabase.from('site_settings').select('*');
      if (err) throw err;
      const map: Record<string, string> = {};
      (data as SiteSetting[] || []).forEach(s => { map[s.key] = String(s.value ?? ''); });
      setGeneralSettings(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load general settings');
    } finally {
      setGeneralLoading(false);
    }
  }, []);

  const saveGeneralSettings = async () => {
    setGeneralSaving(true);
    setError(null);
    try {
      for (const field of GENERAL_FIELDS) {
        const value = generalSettings[field.key] || '';
        const { error: err } = await supabase
          .from('site_settings')
          .upsert({ key: field.key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (err) throw err;
      }
      setSuccessMsg('General settings saved successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save general settings');
    } finally {
      setGeneralSaving(false);
    }
  };

  // ─── Theme Settings ───────────────────────────────────────────────────────

  const fetchThemeSettings = useCallback(async () => {
    setThemeLoading(true);
    try {
      const { data, error: err } = await supabase.from('theme_settings').select('*');
      if (err) throw err;
      const map: Record<string, string> = {};
      (data as ThemeSetting[] || []).forEach(s => { map[s.key] = String(s.value ?? ''); });
      setThemeSettings(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load theme settings');
    } finally {
      setThemeLoading(false);
    }
  }, []);

  const saveThemeSettings = async () => {
    setThemeSaving(true);
    setError(null);
    try {
      for (const field of THEME_FIELDS) {
        const value = themeSettings[field.key] || '';
        const { error: err } = await supabase
          .from('theme_settings')
          .upsert({ key: field.key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (err) throw err;
      }
      setSuccessMsg('Theme settings saved successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save theme settings');
    } finally {
      setThemeSaving(false);
    }
  };

  // ─── Shipping ─────────────────────────────────────────────────────────────

  const fetchShipping = useCallback(async () => {
    setShippingLoading(true);
    try {
      const [zonesRes, ratesRes] = await Promise.all([
        supabase.from('shipping_zones').select('*').order('name'),
        supabase.from('shipping_rates').select('*').order('name'),
      ]);
      if (zonesRes.error) throw zonesRes.error;
      if (ratesRes.error) throw ratesRes.error;
      setShippingZones(zonesRes.data || []);
      setShippingRates(ratesRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shipping settings');
    } finally {
      setShippingLoading(false);
    }
  }, []);

  const saveZone = async () => {
    setShippingSaving(true);
    setError(null);
    try {
      const regions = zoneForm.regions.split(',').map(r => r.trim()).filter(Boolean);
      if (editingZone) {
        const { error: err } = await supabase.from('shipping_zones').update({ name: zoneForm.name, regions }).eq('id', editingZone.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('shipping_zones').insert([{ name: zoneForm.name, regions }]);
        if (err) throw err;
      }
      setShowZoneForm(false);
      setEditingZone(null);
      fetchShipping();
      setSuccessMsg('Shipping zone saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save zone');
    } finally {
      setShippingSaving(false);
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Delete this shipping zone and its rates?')) return;
    try {
      await supabase.from('shipping_rates').delete().eq('zone_id', id);
      const { error: err } = await supabase.from('shipping_zones').delete().eq('id', id);
      if (err) throw err;
      fetchShipping();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete zone');
    }
  };

  const saveRate = async () => {
    setShippingSaving(true);
    setError(null);
    try {
      const payload = {
        ...rateForm,
        is_free_above: rateForm.is_free_above ? parseFloat(rateForm.is_free_above) : null,
      };
      if (editingRate) {
        const { error: err } = await supabase.from('shipping_rates').update(payload).eq('id', editingRate.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('shipping_rates').insert([payload]);
        if (err) throw err;
      }
      setShowRateForm(false);
      setEditingRate(null);
      fetchShipping();
      setSuccessMsg('Shipping rate saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save rate');
    } finally {
      setShippingSaving(false);
    }
  };

  const deleteRate = async (id: string) => {
    if (!confirm('Delete this shipping rate?')) return;
    try {
      const { error: err } = await supabase.from('shipping_rates').delete().eq('id', id);
      if (err) throw err;
      fetchShipping();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete rate');
    }
  };

  // ─── Analytics Pixels ─────────────────────────────────────────────────────

  const fetchPixels = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data, error: err } = await supabase.from('analytics_pixels').select('*').order('name');
      if (err) throw err;
      setPixels(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics pixels');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const savePixel = async () => {
    setAnalyticsSaving(true);
    setError(null);
    try {
      if (editingPixel) {
        const { error: err } = await supabase.from('analytics_pixels').update(pixelForm).eq('id', editingPixel.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('analytics_pixels').insert([pixelForm]);
        if (err) throw err;
      }
      setShowPixelForm(false);
      setEditingPixel(null);
      fetchPixels();
      setSuccessMsg('Analytics pixel saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save pixel');
    } finally {
      setAnalyticsSaving(false);
    }
  };

  const deletePixel = async (id: string) => {
    if (!confirm('Delete this tracking pixel?')) return;
    try {
      const { error: err } = await supabase.from('analytics_pixels').delete().eq('id', id);
      if (err) throw err;
      fetchPixels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete pixel');
    }
  };

  const togglePixelActive = async (pixel: AnalyticsPixel) => {
    try {
      const { error: err } = await supabase.from('analytics_pixels').update({ is_active: !pixel.is_active }).eq('id', pixel.id);
      if (err) throw err;
      fetchPixels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pixel');
    }
  };

  // ─── Menus ────────────────────────────────────────────────────────────────

  const fetchMenus = useCallback(async () => {
    setMenusLoading(true);
    try {
      const { data, error: err } = await supabase.from('menus').select('*').order('name');
      if (err) throw err;
      setMenus(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load menus');
    } finally {
      setMenusLoading(false);
    }
  }, []);

  const fetchMenuItems = useCallback(async (menuId: string) => {
    try {
      const { data, error: err } = await supabase.from('menu_items').select('*').eq('menu_id', menuId).order('sort_order');
      if (err) throw err;
      setMenuItems(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    }
  }, []);

  const saveMenu = async () => {
    setMenusSaving(true);
    setError(null);
    try {
      if (editingMenu) {
        const { error: err } = await supabase.from('menus').update({ name: menuForm.name, location: menuForm.location }).eq('id', editingMenu.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('menus').insert([{ name: menuForm.name, location: menuForm.location }]);
        if (err) throw err;
      }
      setShowMenuForm(false);
      setEditingMenu(null);
      fetchMenus();
      setSuccessMsg('Menu saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save menu');
    } finally {
      setMenusSaving(false);
    }
  };

  const deleteMenu = async (id: string) => {
    if (!confirm('Delete this menu and all its items?')) return;
    try {
      await supabase.from('menu_items').delete().eq('menu_id', id);
      const { error: err } = await supabase.from('menus').delete().eq('id', id);
      if (err) throw err;
      if (selectedMenu?.id === id) {
        setSelectedMenu(null);
        setMenuItems([]);
      }
      fetchMenus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu');
    }
  };

  const saveMenuItem = async () => {
    if (!selectedMenu) return;
    setMenusSaving(true);
    setError(null);
    try {
      const payload = {
        ...menuItemForm,
        menu_id: selectedMenu.id,
        parent_id: menuItemForm.parent_id || null,
      };
      if (editingMenuItem) {
        const { error: err } = await supabase.from('menu_items').update(payload).eq('id', editingMenuItem.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('menu_items').insert([payload]);
        if (err) throw err;
      }
      setShowMenuItemForm(false);
      setEditingMenuItem(null);
      fetchMenuItems(selectedMenu.id);
      setSuccessMsg('Menu item saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setMenusSaving(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!selectedMenu) return;
    try {
      const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
      if (err) throw err;
      fetchMenuItems(selectedMenu.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item');
    }
  };

  // ─── Init Fetch on Tab Change ──────────────────────────────────────────────

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    switch (activeTab) {
      case 'general': fetchGeneralSettings(); break;
      case 'theme': fetchThemeSettings(); break;
      case 'shipping': fetchShipping(); break;
      case 'analytics': fetchPixels(); break;
      case 'menus': fetchMenus(); break;
    }
  }, [activeTab, fetchGeneralSettings, fetchThemeSettings, fetchShipping, fetchPixels, fetchMenus]);

  // ─── Render Helpers ────────────────────────────────────────────────────────

  const Spinner = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => (
    <div className={`border-2 border-deep-green border-t-transparent rounded-full animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'}`} />
  );

  const LoadingBlock = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );

  const SaveButton = ({ onClick, saving, label = 'Save Changes' }: { onClick: () => void; saving: boolean; label?: string }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="px-5 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {label}
    </button>
  );

  // ─── Tab Content Renderers ────────────────────────────────────────────────

  const renderGeneral = () => {
    if (generalLoading) return <LoadingBlock />;
    return (
      <div className="space-y-5">
        {GENERAL_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={generalSettings[field.key] || ''}
                onChange={(e) => setGeneralSettings(s => ({ ...s, [field.key]: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all resize-y"
              />
            ) : (
              <input
                type={field.type}
                value={generalSettings[field.key] || ''}
                onChange={(e) => setGeneralSettings(s => ({ ...s, [field.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all"
              />
            )}
          </div>
        ))}
        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <SaveButton onClick={saveGeneralSettings} saving={generalSaving} />
        </div>
      </div>
    );
  };

  const renderTheme = () => {
    if (themeLoading) return <LoadingBlock />;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {THEME_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              {field.type === 'color' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeSettings[field.key] || '#000000'}
                    onChange={(e) => setThemeSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={themeSettings[field.key] || ''}
                    onChange={(e) => setThemeSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                    placeholder="#000000"
                  />
                </div>
              ) : field.type === 'select' ? (
                <select
                  value={themeSettings[field.key] || ''}
                  onChange={(e) => setThemeSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                >
                  <option value="">Select...</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={themeSettings[field.key] || ''}
                  onChange={(e) => setThemeSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Color Preview</h4>
          <div className="flex gap-3">
            {['primary_color', 'secondary_color', 'accent_color'].map(key => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-white shadow"
                  style={{ backgroundColor: themeSettings[key] || '#ccc' }}
                />
                <span className="text-xs text-gray-500">{key.replace('_color', '')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <SaveButton onClick={saveThemeSettings} saving={themeSaving} />
        </div>
      </div>
    );
  };

  const renderShipping = () => {
    if (shippingLoading) return <LoadingBlock />;
    return (
      <div className="space-y-6">
        {/* Zones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Shipping Zones</h3>
            <button
              onClick={() => { setEditingZone(null); setZoneForm({ name: '', regions: '' }); setShowZoneForm(true); }}
              className="px-3 py-1.5 text-xs font-medium bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors"
            >
              + Add Zone
            </button>
          </div>

          {showZoneForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zone Name</label>
                  <input type="text" value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="e.g. United Kingdom" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Regions (comma-separated)</label>
                  <input type="text" value={zoneForm.regions} onChange={e => setZoneForm(f => ({ ...f, regions: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="England, Scotland, Wales" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowZoneForm(false)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={saveZone} disabled={shippingSaving} className="px-3 py-1.5 text-xs bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50">{editingZone ? 'Update' : 'Create'} Zone</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {shippingZones.map(zone => (
              <div key={zone.id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{(zone.regions || []).join(', ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingZone(zone); setZoneForm({ name: zone.name, regions: (zone.regions || []).join(', ') }); setShowZoneForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => deleteZone(zone.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {shippingZones.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No shipping zones configured</p>}
          </div>
        </div>

        {/* Rates */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Shipping Rates</h3>
            <button
              onClick={() => { setEditingRate(null); setRateForm({ zone_id: shippingZones[0]?.id || '', name: '', min_weight: 0, max_weight: 0, min_order_value: 0, max_order_value: 0, price: 0, is_free_above: '', is_active: true }); setShowRateForm(true); }}
              disabled={shippingZones.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Rate
            </button>
          </div>

          {showRateForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Zone</label>
                  <select value={rateForm.zone_id} onChange={e => setRateForm(f => ({ ...f, zone_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none">
                    {shippingZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate Name</label>
                  <input type="text" value={rateForm.name} onChange={e => setRateForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="Standard Delivery" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Weight (kg)</label>
                  <input type="number" step="0.1" value={rateForm.min_weight} onChange={e => setRateForm(f => ({ ...f, min_weight: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Weight (kg)</label>
                  <input type="number" step="0.1" value={rateForm.max_weight} onChange={e => setRateForm(f => ({ ...f, max_weight: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                  <input type="number" step="0.01" value={rateForm.price} onChange={e => setRateForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Free Above</label>
                  <input type="number" step="0.01" value={rateForm.is_free_above} onChange={e => setRateForm(f => ({ ...f, is_free_above: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="Optional" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rate-active" checked={rateForm.is_active} onChange={e => setRateForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-gray-300 text-deep-green focus:ring-deep-green" />
                <label htmlFor="rate-active" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRateForm(false)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={saveRate} disabled={shippingSaving} className="px-3 py-1.5 text-xs bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50">{editingRate ? 'Update' : 'Create'} Rate</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Zone</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Weight</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippingRates.map(rate => {
                  const zone = shippingZones.find(z => z.id === rate.zone_id);
                  return (
                    <tr key={rate.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{rate.name}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-600">{zone?.name || 'Unknown'}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-900 font-mono">{rate.price > 0 ? `£${rate.price.toFixed(2)}` : 'Free'}{rate.is_free_above ? ` (free above £${rate.is_free_above})` : ''}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{rate.min_weight}–{rate.max_weight}kg</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rate.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingRate(rate); setRateForm({ zone_id: rate.zone_id, name: rate.name, min_weight: rate.min_weight, max_weight: rate.max_weight, min_order_value: rate.min_order_value, max_order_value: rate.max_order_value, price: rate.price, is_free_above: rate.is_free_above?.toString() || '', is_active: rate.is_active }); setShowRateForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => deleteRate(rate.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shippingRates.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No shipping rates configured</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (analyticsLoading) return <LoadingBlock />;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Manage tracking pixels and analytics scripts</p>
          <button
            onClick={() => { setEditingPixel(null); setPixelForm({ name: '', type: 'Google Analytics', pixel_id: '', script_head: '', script_body: '', is_active: true }); setShowPixelForm(true); }}
            className="px-3 py-1.5 text-xs font-medium bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors"
          >
            + Add Pixel
          </button>
        </div>

        {showPixelForm && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input type="text" value={pixelForm.name} onChange={e => setPixelForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="My GA4" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={pixelForm.type} onChange={e => setPixelForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none">
                  {PIXEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pixel / Tracking ID</label>
                <input type="text" value={pixelForm.pixel_id} onChange={e => setPixelForm(f => ({ ...f, pixel_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="G-XXXXXXXXXX" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Head Script</label>
              <textarea value={pixelForm.script_head} onChange={e => setPixelForm(f => ({ ...f, script_head: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y" placeholder="<script>...</script>" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body Script</label>
              <textarea value={pixelForm.script_body} onChange={e => setPixelForm(f => ({ ...f, script_body: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y" placeholder="<noscript>...</noscript>" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pixel-active" checked={pixelForm.is_active} onChange={e => setPixelForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-gray-300 text-deep-green focus:ring-deep-green" />
              <label htmlFor="pixel-active" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowPixelForm(false); setEditingPixel(null); }} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={savePixel} disabled={analyticsSaving} className="px-3 py-1.5 text-xs bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50">{editingPixel ? 'Update' : 'Create'} Pixel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {pixels.map(pixel => (
            <div key={pixel.id} className={`p-4 rounded-lg border transition-colors ${pixel.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${pixel.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{pixel.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{pixel.type}</span>
                  </div>
                  {pixel.pixel_id && (
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">{pixel.pixel_id}</code>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePixelActive(pixel)} className={`p-1.5 rounded-lg transition-colors ${pixel.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`} title={pixel.is_active ? 'Deactivate' : 'Activate'}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                  </button>
                  <button onClick={() => { setEditingPixel(pixel); setPixelForm({ name: pixel.name, type: pixel.type, pixel_id: pixel.pixel_id, script_head: pixel.script_head, script_body: pixel.script_body, is_active: pixel.is_active }); setShowPixelForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => deletePixel(pixel.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pixels.length === 0 && !showPixelForm && (
            <p className="text-sm text-gray-500 text-center py-6">No tracking pixels configured</p>
          )}
        </div>
      </div>
    );
  };

  const renderMenus = () => {
    if (menusLoading) return <LoadingBlock />;
    return (
      <div className="space-y-6">
        {/* Menus List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Navigation Menus</h3>
            <button
              onClick={() => { setEditingMenu(null); setMenuForm({ name: '', location: 'header' }); setShowMenuForm(true); }}
              className="px-3 py-1.5 text-xs font-medium bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors"
            >
              + Add Menu
            </button>
          </div>

          {showMenuForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Menu Name</label>
                  <input type="text" value={menuForm.name} onChange={e => setMenuForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="Main Navigation" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <select value={menuForm.location} onChange={e => setMenuForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none">
                    {MENU_LOCATIONS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowMenuForm(false); setEditingMenu(null); }} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={saveMenu} disabled={menusSaving} className="px-3 py-1.5 text-xs bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50">{editingMenu ? 'Update' : 'Create'} Menu</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {menus.map(menu => (
              <div
                key={menu.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedMenu?.id === menu.id ? 'border-deep-green bg-deep-green/5 ring-1 ring-deep-green/20' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                onClick={() => { setSelectedMenu(menu); fetchMenuItems(menu.id); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{menu.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{menu.location}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingMenu(menu); setMenuForm({ name: menu.name, location: menu.location }); setShowMenuForm(true); }} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    <button onClick={() => deleteMenu(menu.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {menus.length === 0 && !showMenuForm && <p className="text-sm text-gray-500 text-center py-4">No menus configured</p>}
        </div>

        {/* Menu Items */}
        {selectedMenu && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Items: {selectedMenu.name}</h3>
              <button
                onClick={() => {
                  setEditingMenuItem(null);
                  const nextOrder = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.sort_order)) + 1 : 0;
                  setMenuItemForm({ label: '', url: '', parent_id: '', sort_order: nextOrder });
                  setShowMenuItemForm(true);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors"
              >
                + Add Item
              </button>
            </div>

            {showMenuItemForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                    <input type="text" value={menuItemForm.label} onChange={e => setMenuItemForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="Home" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                    <input type="text" value={menuItemForm.url} onChange={e => setMenuItemForm(f => ({ ...f, url: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" placeholder="/about" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Parent Item (optional)</label>
                    <select value={menuItemForm.parent_id} onChange={e => setMenuItemForm(f => ({ ...f, parent_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none">
                      <option value="">None (top level)</option>
                      {menuItems.filter(i => !i.parent_id).map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                    <input type="number" value={menuItemForm.sort_order} onChange={e => setMenuItemForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowMenuItemForm(false); setEditingMenuItem(null); }} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={saveMenuItem} disabled={menusSaving} className="px-3 py-1.5 text-xs bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50">{editingMenuItem ? 'Update' : 'Add'} Item</button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {menuItems.filter(i => !i.parent_id).map(item => (
                <div key={item.id}>
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-400 w-6 text-center">{item.sort_order}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">{item.label}</span>
                    <code className="text-xs text-gray-500 font-mono">{item.url}</code>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingMenuItem(item); setMenuItemForm({ label: item.label, url: item.url, parent_id: item.parent_id || '', sort_order: item.sort_order }); setShowMenuItemForm(true); }} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      <button onClick={() => deleteMenuItem(item.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  {/* Child items */}
                  {menuItems.filter(c => c.parent_id === item.id).map(child => (
                    <div key={child.id} className="ml-8 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 mt-1">
                      <span className="text-xs text-gray-400 w-6 text-center">{child.sort_order}</span>
                      <span className="text-sm text-gray-700 flex-1">{child.label}</span>
                      <code className="text-xs text-gray-500 font-mono">{child.url}</code>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingMenuItem(child); setMenuItemForm({ label: child.label, url: child.url, parent_id: child.parent_id || '', sort_order: child.sort_order }); setShowMenuItemForm(true); }} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                        </button>
                        <button onClick={() => deleteMenuItem(child.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {menuItems.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No items in this menu</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your store settings, theme, shipping, and more</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-4">
          <nav className="flex -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-deep-green text-deep-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && renderGeneral()}
          {activeTab === 'theme' && renderTheme()}
          {activeTab === 'shipping' && renderShipping()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'menus' && renderMenus()}
        </div>
      </div>
    </div>
  );
}
