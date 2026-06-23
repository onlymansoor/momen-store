'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Grid3X3,
  Upload,
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
import { generateSlug } from '@/lib/utils';
import type { Category } from '@/lib/types';
import toast from 'react-hot-toast';

function CategoryImage({ url, name }: { url?: string | null; name: string }) {
  const [error, setError] = useState(false);
  if (!url || error) return <ImageIcon className="h-6 w-6 text-white-muted" />;
  return <img src={url} alt={name} className="h-full w-full object-cover" onError={() => setError(true)} />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true, image_url: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('categories')
        .select('*, product_count:products(count)')
        .order('name');
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', is_active: true, image_url: '' });
    setImageFile(null);
    setImagePreview('');
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      is_active: cat.is_active,
      image_url: cat.image_url || '',
    });
    setImageFile(null);
    setImagePreview(cat.image_url || '');
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
        image_url: form.image_url.trim() || null,
      };

      if (editingCategory) {
        const { error } = await supabase.from('categories').update(data).eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert(data);
        if (error) throw error;
        toast.success('Category created');
      }

      setModalOpen(false);
      loadCategories();
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
      const { error } = await supabase.from('categories').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Category deleted');
      setDeleteId(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-white-muted mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : categories.length === 0 ? (
        <EmptyState icon={<Grid3X3 className="h-8 w-8" />} title="No categories yet" description="Create your first category to organize products" action={{ label: 'Add Category', onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 overflow-hidden border border-white/10">
                    <CategoryImage url={cat.image_url} name={cat.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{cat.name}</h3>
                    <p className="text-xs text-white-muted mt-0.5">/{cat.slug}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white-muted">{(cat as any).product_count?.[0]?.count || 0} products</span>
                      <Badge variant={cat.is_active ? 'success' : 'error'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(cat)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-accent hover:bg-accent/10 transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {cat.description && (
                  <p className="mt-3 text-xs text-white-muted line-clamp-2">{cat.description}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value, slug: editingCategory ? p.slug : generateSlug(e.target.value) })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} />
          <Input label="Slug" value={form.slug} onChange={e => { setForm(p => ({ ...p, slug: e.target.value })); setErrors(p => ({ ...p, slug: '' })); }} error={errors.slug} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white-muted">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white-muted">Image</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Or paste image URL"
                value={form.image_url}
                onChange={e => { setForm(p => ({ ...p, image_url: e.target.value })); setImagePreview(e.target.value); }}
                className="flex-1 h-10 rounded-lg glass px-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
              />
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg glass hover:bg-white/10 transition-colors">
                <Upload className="h-4 w-4 text-white-muted" />
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageUploading(true);
                  try {
                    const ext = file.name.split('.').pop();
                    const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
                    const { data, error } = await supabase.storage.from('products').upload(fileName, file, { upsert: true });
                    if (error) { toast.error('Upload failed - try pasting a URL'); return; }
                    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(data.path);
                    setForm(p => ({ ...p, image_url: publicUrl }));
                    setImagePreview(publicUrl);
                    toast.success('Image uploaded');
                  } catch { toast.error('Upload failed - try pasting a URL'); }
                  finally { setImageUploading(false); }
                }} />
              </label>
            </div>
            {imagePreview ? (
              <div className="relative h-24 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img src={imagePreview} alt="" className="h-full w-full object-contain" onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).classList.add('hidden') }} />
                <div className="absolute inset-0 flex items-center justify-center text-white-muted/40 text-xs pointer-events-none">Preview</div>
              </div>
            ) : null}
            {imageUploading && <p className="text-xs text-white-muted animate-pulse">Uploading...</p>}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/50" />
            <span className="text-sm text-white">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingCategory ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Category" description="Are you sure? Products in this category will not be deleted but will become uncategorized." onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
