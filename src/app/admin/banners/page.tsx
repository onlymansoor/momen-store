'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  GripVertical,
  Upload,
  X,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import type { Banner } from '@/lib/types';
import toast from 'react-hot-toast';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    link_text: '',
    is_active: true,
    sort_order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => { loadBanners(); }, []);

  async function loadBanners() {
    setLoading(true);
    try {
      const { data } = await supabase.from('banners').select('*').order('sort_order');
      setBanners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingBanner(null);
    setForm({ title: '', subtitle: '', link_url: '', link_text: '', is_active: true, sort_order: banners.length });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setImagePreview(banner.image_url);
    setImageFile(null);
    setErrors({});
    setModalOpen(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!imagePreview && !editingBanner) errs.image = 'Image is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      let image_url = editingBanner?.image_url || '';

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const filePath = `banners/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(filePath);
        image_url = publicUrl;
      }

      const data = {
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        link_url: form.link_url.trim() || null,
        link_text: form.link_text.trim() || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
        image_url,
      };

      if (editingBanner) {
        await supabase.from('banners').update(data).eq('id', editingBanner.id);
        toast.success('Banner updated');
      } else {
        await supabase.from('banners').insert(data);
        toast.success('Banner created');
      }

      setModalOpen(false);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase.from('banners').delete().eq('id', deleteId);
      toast.success('Banner deleted');
      setDeleteId(null);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDragEnd() {
    if (draggedIndex === null) return;
    setDraggedIndex(null);
  }

  function moveBanner(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index].sort_order;
    updated[index] = { ...updated[index], sort_order: updated[newIndex].sort_order };
    updated[newIndex] = { ...updated[newIndex], sort_order: temp };

    const reordered = direction === 'up'
      ? [updated[index], updated[newIndex]]
      : [updated[newIndex], updated[index]];
    updated[index] = reordered[0];
    updated[newIndex] = reordered[1];

    setBanners(updated);

    supabase.from('banners').update({ sort_order: updated[index].sort_order }).eq('id', updated[index].id).then();
    supabase.from('banners').update({ sort_order: updated[newIndex].sort_order }).eq('id', updated[newIndex].id).then();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Banners</h1>
          <p className="text-sm text-white-muted mt-1">{banners.length} banners</p>
        </div>
        <Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add Banner</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : banners.length === 0 ? (
        <EmptyState icon={<ImageIcon className="h-8 w-8" />} title="No banners yet" description="Create your first banner to display on the homepage" action={{ label: 'Add Banner', onClick: openAdd }} />
      ) : (
        <div className="space-y-4">
          {banners.map((banner, i) => (
            <motion.div key={banner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveBanner(i, 'up')} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded text-white-muted hover:text-white disabled:opacity-30 transition-colors">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveBanner(i, 'down')} disabled={i === banners.length - 1} className="flex h-6 w-6 items-center justify-center rounded text-white-muted hover:text-white disabled:opacity-30 transition-colors">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white/5">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-white-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{banner.title || 'Untitled'}</h3>
                    {banner.subtitle && <p className="text-xs text-white-muted mt-0.5">{banner.subtitle}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={banner.is_active ? 'success' : 'error'}>{banner.is_active ? 'Active' : 'Inactive'}</Badge>
                      <span className="text-xs text-white-muted">Order: {banner.sort_order}</span>
                      {banner.link_url && <span className="text-xs text-white-muted truncate max-w-[200px]">{banner.link_url}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(banner)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-accent hover:bg-accent/10 transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(banner.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingBanner ? 'Edit Banner' : 'Add Banner'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Input label="Subtitle" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
          <Input label="Link URL" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} placeholder="https://..." />
          <Input label="Link Text" value={form.link_text} onChange={e => setForm(p => ({ ...p, link_text: e.target.value }))} placeholder="Shop Now" />
          <Input label="Sort Order" type="number" value={form.sort_order.toString()} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white-muted">Banner Image</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-white-muted hover:text-white hover:bg-white/5 transition-colors">
                <Upload className="h-4 w-4" /> Choose Image
              </button>
              {imagePreview && <span className="text-xs text-white-muted">Image selected</span>}
            </div>
            {imagePreview && (
              <div className="relative mt-2 w-full max-h-32 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="" className="w-full object-contain max-h-32" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {errors.image && <p className="text-xs text-red-400">{errors.image}</p>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/50" />
            <span className="text-sm text-white">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingBanner ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Banner" description="Are you sure you want to delete this banner?" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
