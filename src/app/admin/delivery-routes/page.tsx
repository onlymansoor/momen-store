'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface City { id: string; name: string; is_active: boolean; }
interface Route { id: string; from_city_id: string; to_city_id: string; base_price: number; home_delivery: boolean; bilty_available: boolean; estimated_days: number; is_active: boolean; from_city?: City; to_city?: City; }

const emptyRoute = { from_city_id: '', to_city_id: '', base_price: '', home_delivery: 'true', bilty_available: 'false', estimated_days: '3', is_active: 'true' };

export default function DeliveryRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRoute);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [rRes, cRes] = await Promise.all([
      supabase.from('delivery_routes').select('*, from_city:cities!from_city_id(*), to_city:cities!to_city_id(*)').order('created_at'),
      supabase.from('cities').select('id, name, is_active').eq('is_active', true).order('name'),
    ]);
    setRoutes(rRes.data || []);
    setCities(cRes.data || []);
    setLoading(false);
  }

  async function saveRoute() {
    if (!form.from_city_id || !form.to_city_id || !form.base_price) { toast.error('Fill required fields'); return; }
    if (form.from_city_id === form.to_city_id) { toast.error('From and To cities must differ'); return; }
    setSaving(true);
    const payload = {
      from_city_id: form.from_city_id,
      to_city_id: form.to_city_id,
      base_price: parseFloat(form.base_price),
      home_delivery: form.home_delivery === 'true',
      bilty_available: form.bilty_available === 'true',
      estimated_days: parseInt(form.estimated_days),
      is_active: form.is_active === 'true',
    };
    const { error } = editingId
      ? await supabase.from('delivery_routes').update(payload).eq('id', editingId)
      : await supabase.from('delivery_routes').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(editingId ? 'Route updated' : 'Route created'); setShowForm(false); setEditingId(null); setForm(emptyRoute); loadData(); }
    setSaving(false);
  }

  async function toggleRoute(route: Route) {
    await supabase.from('delivery_routes').update({ is_active: !route.is_active }).eq('id', route.id);
    loadData();
  }

  async function deleteRoute(id: string) {
    await supabase.from('delivery_routes').delete().eq('id', id);
    setDeleteId(null); toast.success('Route deleted'); loadData();
  }

  function editRoute(route: Route) {
    setForm({
      from_city_id: route.from_city_id,
      to_city_id: route.to_city_id,
      base_price: route.base_price.toString(),
      home_delivery: route.home_delivery ? 'true' : 'false',
      bilty_available: route.bilty_available ? 'true' : 'false',
      estimated_days: route.estimated_days.toString(),
      is_active: route.is_active ? 'true' : 'false',
    });
    setEditingId(route.id);
    setShowForm(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Delivery Routes</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyRoute); }}>
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Create Route'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Route' : 'Create Route'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="From City"
              options={[{ value: '', label: 'Select...' }, ...cities.map(c => ({ value: c.id, label: c.name }))]}
              value={form.from_city_id}
              onValueChange={v => setForm(f => ({ ...f, from_city_id: v }))}
            />
            <Select
              label="To City"
              options={[{ value: '', label: 'Select...' }, ...cities.map(c => ({ value: c.id, label: c.name }))]}
              value={form.to_city_id}
              onValueChange={v => setForm(f => ({ ...f, to_city_id: v }))}
            />
            <Input label="Base Delivery Price (Rs)" type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="4500" />
            <Input label="Estimated Days" type="number" value={form.estimated_days} onChange={e => setForm(f => ({ ...f, estimated_days: e.target.value }))} />
            <Select label="Home Delivery" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} value={form.home_delivery} onValueChange={v => setForm(f => ({ ...f, home_delivery: v }))} />
            <Select label="Bilty Available" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} value={form.bilty_available} onValueChange={v => setForm(f => ({ ...f, bilty_available: v }))} />
            <Select label="Status" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} value={form.is_active} onValueChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </div>
          <Button className="mt-4" onClick={saveRoute} loading={saving}>
            {editingId ? 'Update' : 'Save'} Route
          </Button>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-white-muted">
                <th className="pb-3 pr-4">From</th>
                <th className="pb-3 pr-4">To</th>
                <th className="pb-3 pr-4">Base Price</th>
                <th className="pb-3 pr-4">Home</th>
                <th className="pb-3 pr-4">Bilty</th>
                <th className="pb-3 pr-4">Days</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(r => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white">{r.from_city?.name || 'Unknown'}</td>
                  <td className="py-3 pr-4 text-white">{r.to_city?.name || 'Unknown'}</td>
                  <td className="py-3 pr-4 text-accent font-medium">Rs {r.base_price.toLocaleString()}</td>
                  <td className="py-3 pr-4">{r.home_delivery ? <span className="text-emerald-400">Yes</span> : <span className="text-white-muted">No</span>}</td>
                  <td className="py-3 pr-4">{r.bilty_available ? <span className="text-emerald-400">Yes</span> : <span className="text-white-muted">No</span>}</td>
                  <td className="py-3 pr-4 text-white-muted">{r.estimated_days} days</td>
                  <td className="py-3 pr-4">
                    <Button variant="ghost" size="sm" onClick={() => toggleRoute(r)} className={r.is_active ? 'text-emerald-400' : 'text-white-muted'}>
                      {r.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editRoute(r)}><Edit className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)} className="text-red-400"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-white-muted">No routes defined.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Route" description="Delete this delivery route?" onConfirm={() => deleteRoute(deleteId!)} />
    </div>
  );
}