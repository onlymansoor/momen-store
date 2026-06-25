'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Multiplier { id: string; category_name: string; additional_cost: number; is_active: boolean; }

export default function FurnitureMultipliersPage() {
  const [items, setItems] = useState<Multiplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('furniture_multipliers').select('*').order('additional_cost');
    setItems(data || []); setLoading(false);
  }

  async function create() {
    if (!newName.trim() || !newCost) return;
    setSaving(true);
    const { error } = await supabase.from('furniture_multipliers').insert({ category_name: newName.trim(), additional_cost: parseFloat(newCost) });
    if (error) toast.error(error.message);
    else { toast.success('Multiplier added'); setNewName(''); setNewCost(''); load(); }
    setSaving(false);
  }

  async function update(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('furniture_multipliers').update({ category_name: editName.trim(), additional_cost: parseFloat(editCost) }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Updated'); setEditingId(null); load(); }
    setSaving(false);
  }

  async function toggle(item: Multiplier) {
    await supabase.from('furniture_multipliers').update({ is_active: !item.is_active }).eq('id', item.id);
    load();
  }

  async function remove(id: string) {
    await supabase.from('furniture_multipliers').delete().eq('id', id);
    setDeleteId(null); toast.success('Deleted'); load();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Furniture Size Multipliers</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add New</h2>
        <div className="flex gap-4 items-end">
          <Input label="Category Name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Bed" />
          <Input label="Additional Cost (Rs)" type="number" value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="1500" />
          <Button onClick={create} loading={saving}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </Card>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-sm text-white-muted">
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Additional Cost</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="w-48" autoFocus />
                  ) : (
                    <span className="text-white font-medium">{item.category_name}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <Input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} className="w-32" />
                  ) : (
                    <span className="text-accent font-medium">+Rs {item.additional_cost.toLocaleString()}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Button variant="ghost" size="sm" onClick={() => toggle(item)} className={item.is_active ? 'text-emerald-400' : 'text-white-muted'}>
                    {item.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                </td>
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="primary" onClick={() => update(item.id)} loading={saving}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(item.id); setEditName(item.category_name); setEditCost(item.additional_cost.toString()); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(item.id)} className="text-red-400"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="py-12 text-center text-white-muted">No multipliers defined.</div>}
      </Card>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete" description="Delete this multiplier?" onConfirm={() => remove(deleteId!)} />
    </div>
  );
}