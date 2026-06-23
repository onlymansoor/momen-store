'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  X,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Camera,
  Hash,
  Truck,
  CreditCard,
  Search,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import type { Setting } from '@/lib/types';
import toast from 'react-hot-toast';

interface SettingsData {
  store_name: string;
  whatsapp_number: string;
  support_email: string;
  address: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  delivery_inside_city: string;
  delivery_outside_city: string;
  free_shipping_threshold: string;
  easypaisa_account_name: string;
  easypaisa_account_number: string;
  seo_title: string;
  seo_description: string;
  logo_url: string;
}

const defaultSettings: SettingsData = {
  store_name: 'Momen Store',
  whatsapp_number: '',
  support_email: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  delivery_inside_city: '150',
  delivery_outside_city: '300',
  free_shipping_threshold: '',
  easypaisa_account_name: '',
  easypaisa_account_number: '',
  seo_title: '',
  seo_description: '',
  logo_url: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((s: Setting) => { settingsMap[s.key] = s.value; });
        setForm(prev => ({ ...prev, ...settingsMap }));
        if (settingsMap.logo_url) setLogoPreview(settingsMap.logo_url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  async function saveSetting(key: string, value: any) {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).single();
    if (existing) {
      await supabase.from('settings').update({ value, key }).eq('id', existing.id);
    } else {
      await supabase.from('settings').insert({ key, value });
    }
  }

  async function handleLogoUpload(file: File) {
    const ext = file.name.split('.').pop();
    const filePath = `settings/logo.${ext}`;
    const { error } = await supabase.storage.from('settings').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('settings').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleSave() {
    setSaving(true);
    try {
      let logo_url = form.logo_url;
      if (logoFile) {
        logo_url = await handleLogoUpload(logoFile);
        setLogoPreview(logo_url);
        setLogoFile(null);
      }

      const entries = Object.entries({ ...form, logo_url });
      for (const [key, value] of entries) {
        await saveSetting(key, value);
      }

      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Spinner size={36} /></div>;
  }

  const sectionClass = 'p-5 space-y-4';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white-muted mt-1">Manage your store configuration</p>
        </div>
        <Button onClick={handleSave} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
          Save All Settings
        </Button>
      </div>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <Store className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Store Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Store Name" value={form.store_name} onChange={e => updateField('store_name', e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white-muted">Store Logo</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-white-muted hover:text-white hover:bg-white/5 transition-colors">
                <Upload className="h-4 w-4" /> Choose Logo
              </button>
              {logoPreview && (
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); setForm(p => ({ ...p, logo_url: '' })); }} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }} className="hidden" />
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="WhatsApp Number" value={form.whatsapp_number} onChange={e => updateField('whatsapp_number', e.target.value)} placeholder="+923001234567" />
          <Input label="Support Email" type="email" value={form.support_email} onChange={e => updateField('support_email', e.target.value)} placeholder="support@momenstore.com" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white-muted">Address</label>
          <textarea value={form.address} onChange={e => updateField('address', e.target.value)} rows={2} className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Social Media Links</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Facebook URL" value={form.facebook_url} onChange={e => updateField('facebook_url', e.target.value)} placeholder="https://facebook.com/..." leftIcon={<Globe className="h-4 w-4" />} />
          <Input label="Instagram URL" value={form.instagram_url} onChange={e => updateField('instagram_url', e.target.value)} placeholder="https://instagram.com/..." leftIcon={<Camera className="h-4 w-4" />} />
          <Input label="Twitter URL" value={form.twitter_url} onChange={e => updateField('twitter_url', e.target.value)} placeholder="https://twitter.com/..." leftIcon={<Hash className="h-4 w-4" />} />
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <Truck className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Delivery Settings</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Delivery Charges (Inside City)" type="number" value={form.delivery_inside_city} onChange={e => updateField('delivery_inside_city', e.target.value)} placeholder="150" />
          <Input label="Delivery Charges (Outside City)" type="number" value={form.delivery_outside_city} onChange={e => updateField('delivery_outside_city', e.target.value)} placeholder="300" />
          <Input label="Free Shipping Threshold (Rs)" type="number" value={form.free_shipping_threshold} onChange={e => updateField('free_shipping_threshold', e.target.value)} placeholder="0 for no free shipping" />
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Easypaisa Account Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Account Name" value={form.easypaisa_account_name} onChange={e => updateField('easypaisa_account_name', e.target.value)} placeholder="Momen Store" />
          <Input label="Account Number" value={form.easypaisa_account_number} onChange={e => updateField('easypaisa_account_number', e.target.value)} placeholder="03XXXXXXXXX" />
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">SEO Settings</h2>
        </div>
        <Input label="SEO Title" value={form.seo_title} onChange={e => updateField('seo_title', e.target.value)} placeholder="Momen Store - Your Store Name" />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white-muted">SEO Description</label>
          <textarea value={form.seo_description} onChange={e => updateField('seo_description', e.target.value)} rows={3} className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none" placeholder="Your store description for search engines..." />
        </div>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} loading={saving} size="lg" leftIcon={<Save className="h-5 w-5" />}>
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
