'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Setting { id: string; key: string; value: any; description: string; updated_at: string; }

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState('true');
  const [globalPrice, setGlobalPrice] = useState('');
  const [useGlobalOnly, setUseGlobalOnly] = useState('false');
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('delivery_settings').select('*');
    if (data) {
      setSettings(data);
      for (const s of data) {
        if (s.key === 'manual_quote_message') setMessage(s.value);
        if (s.key === 'manual_quote_whatsapp') setWhatsapp(s.value === 'true' ? 'true' : 'false');
        if (s.key === 'global_delivery_price') setGlobalPrice(s.value.toString());
        if (s.key === 'use_global_only') setUseGlobalOnly(s.value === 'true' ? 'true' : 'false');
      }
    }
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    for (const s of settings) {
      const val = s.key === 'manual_quote_message' ? message : s.key === 'manual_quote_whatsapp' ? whatsapp : s.key === 'global_delivery_price' ? globalPrice : s.key === 'use_global_only' ? useGlobalOnly : s.value;
      await supabase.from('delivery_settings').update({ value: val }).eq('id', s.id);
    }
    toast.success('Settings saved');
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Delivery Settings</h1>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Manual Quote Mode</h2>
          <p className="text-sm text-white-muted mb-4">
            When no route is found for a delivery, this message is shown to the customer.
          </p>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white-muted">Quote Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Global Delivery Price</h2>
          <p className="text-sm text-white-muted mb-4">
            When a city has no specific route but is in your active cities list, this price is used instead of showing a manual quote.
          </p>
          <Input label="Global Delivery Price (Rs)" type="number" value={globalPrice} onChange={e => setGlobalPrice(e.target.value)} placeholder="e.g. 500" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Simplify Delivery</h2>
          <p className="text-sm text-white-muted mb-4">
            When enabled, all route-based pricing is ignored. Only the global price (or per-product override) is used for every order.
          </p>
          <Select
            label="Use only global price (ignore routes)"
            options={[{ value: 'false', label: 'No — use routes + global fallback' }, { value: 'true', label: 'Yes — ignore routes, use global price only' }]}
            value={useGlobalOnly}
            onValueChange={setUseGlobalOnly}
          />
        </div>

        <div>
          <Select
            label="Enable WhatsApp Notification"
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            value={whatsapp}
            onValueChange={setWhatsapp}
          />
          <p className="text-xs text-white-muted mt-1">Send manual quote request to store WhatsApp when route not found.</p>
        </div>

        <Button onClick={save} loading={saving}>Save Settings</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-2">How it works</h2>
        <div className="text-sm text-white-muted space-y-2">
          <p><strong className="text-white">Route Exists:</strong> Final delivery cost = Base Route Price + Furniture Multiplier + Quantity Charge</p>
          <p><strong className="text-white">Route Not Found:</strong> Falls back to global price if set, otherwise shows manual quote.</p>
          <p className="mt-4 text-xs">Example: Lahore → Karachi base Rs 4,500 + Bed (Rs 1,500) + Qty 2 (Rs 300) = Rs 6,300</p>
          <p className="mt-2 text-xs"><strong className="text-white">Global Price:</strong> If enabled and no specific route exists for a city, this flat rate is used.</p>
          <p className="mt-2 text-xs"><strong className="text-white">Product Override:</strong> Products with a custom delivery fee use that price regardless of city.</p>
          <p className="mt-2 text-xs"><strong className="text-white">Simplify Mode:</strong> Ignores all routes — every order uses the global price or the product's custom override.</p>
        </div>
      </Card>
    </div>
  );
}