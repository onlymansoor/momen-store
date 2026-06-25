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

interface Rule { id: string; min_qty: number; max_qty: number | null; delivery_type: 'home' | 'bilty'; price: number; is_active: boolean; }

export default function QuantityRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ min_qty: '', max_qty: '', delivery_type: 'home', price: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('quantity_rules').select('*').order('min_qty').order('delivery_type');
    setRules(data || []); setLoading(false);
  }

  async function save() {
    if (!form.min_qty || !form.price) { toast.error('Fill required fields'); return; }
    setSaving(true);
    const payload = { min_qty: parseInt(form.min_qty), max_qty: form.max_qty ? parseInt(form.max_qty) : null, delivery_type: form.delivery_type, price: parseFloat(form.price) };
    const { error } = editingId
      ? await supabase.from('quantity_rules').update(payload).eq('id', editingId)
      : await supabase.from('quantity_rules').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success(editingId ? 'Updated' : 'Created'); setEditingId(null); setForm({ min_qty: '', max_qty: '', delivery_type: 'home', price: '' }); load(); }
    setSaving(false);
  }

  async function toggle(rule: Rule) {
    await supabase.from('quantity_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    load();
  }

  async function remove(id: string) {
    await supabase.from('quantity_rules').delete().eq('id', id);
    setDeleteId(null); toast.success('Deleted'); load();
  }

  function edit(rule: Rule) {
    setForm({ min_qty: rule.min_qty.toString(), max_qty: rule.max_qty?.toString() || '', delivery_type: rule.delivery_type, price: rule.price.toString() });
    setEditingId(rule.id);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Quantity Rules</h1>
        <Button onClick={() => { setEditingId(null); setForm({ min_qty: '', max_qty: '', delivery_type: 'home', price: '' }); setEditingId('new'); }}>
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>

      {(editingId === 'new') && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Quantity Rule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input label="Min Quantity" type="number" value={form.min_qty} onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))} />
            <Input label="Max Quantity" type="number" value={form.max_qty} onChange={e => setForm(f => ({ ...f, max_qty: e.target.value }))} placeholder="Leave empty for unlimited" />
            <Select label="Delivery Type" options={[{ value: 'home', label: 'Home Delivery' }, { value: 'bilty', label: 'Bilty' }]} value={form.delivery_type} onValueChange={v => setForm(f => ({ ...f, delivery_type: v }))} />
            <Input label="Extra Cost (Rs)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} loading={saving}>Save Rule</Button>
            <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-sm text-white-muted">
              <th className="pb-3 pr-4">Min Qty</th>
              <th className="pb-3 pr-4">Max Qty</th>
              <th className="pb-3 pr-4">Delivery Type</th>
              <th className="pb-3 pr-4">Extra Cost</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="py-3 pr-4 text-white">{r.min_qty}</td>
                <td className="py-3 pr-4 text-white-muted">{r.max_qty !== null ? r.max_qty : '∞'}</td>
                <td className="py-3 pr-4"><span className="capitalize text-white">{r.delivery_type === 'home' ? 'Home' : 'Bilty'}</span></td>
                <td className="py-3 pr-4 text-accent font-medium">Rs {r.price.toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <Button variant="ghost" size="sm" onClick={() => toggle(r)} className={r.is_active ? 'text-emerald-400' : 'text-white-muted'}>
                    {r.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => edit(r)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)} className="text-red-400"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-white-muted">No rules defined.</td></tr>}
          </tbody>
        </table>
      </Card>

      {editingId && editingId !== 'new' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edit Rule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input label="Min Quantity" type="number" value={form.min_qty} onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))} />
            <Input label="Max Quantity" type="number" value={form.max_qty} onChange={e => setForm(f => ({ ...f, max_qty: e.target.value }))} />
            <Select label="Delivery Type" options={[{ value: 'home', label: 'Home Delivery' }, { value: 'bilty', label: 'Bilty' }]} value={form.delivery_type} onValueChange={v => setForm(f => ({ ...f, delivery_type: v }))} />
            <Input label="Extra Cost (Rs)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} loading={saving}>Update Rule</Button>
            <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Rule" description="Delete this quantity rule?" onConfirm={() => remove(deleteId!)} />
    </div>
  );
}