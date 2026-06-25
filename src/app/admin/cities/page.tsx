'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface City {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadCities(); }, []);

  async function loadCities() {
    const { data } = await supabase.from('cities').select('*').order('sort_order');
    setCities(data || []);
    setLoading(false);
  }

  async function createCity() {
    if (!newCityName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('cities').insert({ name: newCityName.trim() });
    if (error) toast.error(error.message);
    else { toast.success('City added'); setNewCityName(''); loadCities(); }
    setSaving(false);
  }

  async function updateCity(city: City) {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('cities').update({ name: editName.trim() }).eq('id', city.id);
    if (error) toast.error(error.message);
    else { toast.success('City updated'); setEditingId(null); loadCities(); }
    setSaving(false);
  }

  async function toggleCity(city: City) {
    const { error } = await supabase.from('cities').update({ is_active: !city.is_active }).eq('id', city.id);
    if (error) toast.error(error.message);
    else { toast.success(`${!city.is_active ? 'Enabled' : 'Disabled'} ${city.name}`); loadCities(); }
  }

  async function deleteCity(id: string) {
    const { error } = await supabase.from('cities').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('City deleted'); setDeleteId(null); loadCities(); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cities Management</h1>
        <Card className="p-4 w-80">
          <Input
            label="Add New City"
            value={newCityName}
            onChange={e => setNewCityName(e.target.value)}
            placeholder="e.g., Lahore"
            onKeyDown={e => e.key === 'Enter' && createCity()}
          />
          <Button className="mt-2 w-full" onClick={createCity} loading={saving}>
            <Plus className="h-4 w-4" /> Add City
          </Button>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-white-muted">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Sort Order</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">
                    {editingId === city.id ? (
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateCity(city)}
                        className="w-48"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-white">{city.name}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-sm text-white-muted">{city.sort_order}</td>
                  <td className="py-3 pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={city.is_active ? 'text-emerald-400' : 'text-white-muted'}
                      onClick={() => toggleCity(city)}
                      loading={saving}
                    >
                      {city.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                  </td>
                  <td className="py-3 pr-4 text-sm text-white-muted">{new Date(city.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {editingId === city.id ? (
                        <>
                          <Button size="sm" variant="primary" onClick={() => updateCity(city)} loading={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditName(city.name); }}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(city.id); setEditName(city.name); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(city.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cities.length === 0 && (
          <div className="py-12 text-center text-white-muted">No cities added yet. Add your first city above.</div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete City"
        description="Are you sure you want to delete this city? This will also remove any delivery routes using it."
        onConfirm={() => deleteCity(deleteId!)}
      />
    </div>
  );
}