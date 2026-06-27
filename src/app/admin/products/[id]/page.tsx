'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  X,
  Upload,
  Plus,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { Category, Product, ProductImage } from '@/lib/types';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState<{ globalPrice: number; routes: { id: string; from: string; to: string; price: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: '',
    price: '',
    compare_price: '',
    cost_price: '',
    sku: '',
    barcode: '',
    stock_quantity: '10',
    low_stock_threshold: '5',
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: false,
    is_active: true,
    meta_title: '',
    meta_description: '',
    weight: '',
    dimensions: '',
    delivery_override: '',
    delivery_overrides: [] as { route_id: string; price: string }[],
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*, images:product_images(*)').eq('id', id).single(),
      fetch('/api/delivery').then(r => r.json()),
    ]).then(([catRes, prodRes, delData]: any) => {
      setCategories(catRes.data || []);
      const p = prodRes.data as Product;
      if (p) {
        const existingOverrides = (p.delivery_overrides || []).map((o: any) => ({ route_id: o.route_id, price: o.price.toString() }));
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description || '',
          short_description: p.short_description || '',
          category_id: p.category_id || '',
          price: p.price.toString(),
          compare_price: p.compare_price?.toString() || '',
          cost_price: p.cost_price?.toString() || '',
          sku: p.sku || '',
          barcode: p.barcode || '',
          stock_quantity: p.stock_quantity.toString(),
          low_stock_threshold: p.low_stock_threshold.toString(),
          is_featured: p.is_featured,
          is_best_seller: p.is_best_seller,
          is_new_arrival: p.is_new_arrival,
          is_active: p.is_active,
          meta_title: p.meta_title || '',
          meta_description: p.meta_description || '',
          weight: p.weight?.toString() || '',
          dimensions: p.dimensions || '',
          delivery_override: p.delivery_override?.toString() || '',
          delivery_overrides: existingOverrides,
          tags: p.tags || [],
        });
        setProductImages(p.images || []);
      }
      if (delData?.settings) {
        const globalS = delData.settings.find((s: any) => s.key === 'global_delivery_price');
        const routes = (delData.routes || []).map((r: any) => ({
          id: r.id,
          from: r.from_city?.name || 'Unknown',
          to: r.to_city?.name || 'Unknown',
          price: Number(r.base_price),
        }));
        setDeliveryInfo({ globalPrice: globalS ? Number(globalS.value) : 0, routes });
      }
      setLoading(false);
    });
  }, [id, supabase]);

  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && prev.slug === generateSlug(prev.name)) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImgs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...newImgs]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImages[index].preview);
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  async function deleteImage(imageId: string) {
    try {
      const img = productImages.find(i => i.id === imageId);
      if (img) {
        const path = img.image_url.split('/').pop();
        if (path) await supabase.storage.from('products').remove([`products/${id}/${path}`]);
      }
      await supabase.from('product_images').delete().eq('id', imageId);
      setProductImages(prev => prev.filter(i => i.id !== imageId));
      toast.success('Image deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteImageId(null);
  }

  async function setPrimaryImage(imageId: string) {
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', id);
    await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);
    setProductImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imageId })));
    toast.success('Primary image updated');
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.price || parseFloat(form.price) < 0) errs.price = 'Valid price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const productData = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        category_id: form.category_id || null,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        stock_quantity: parseInt(form.stock_quantity),
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        is_featured: form.is_featured,
        is_best_seller: form.is_best_seller,
        is_new_arrival: form.is_new_arrival,
        is_active: form.is_active,
        weight: form.weight ? parseFloat(form.weight) : null,
        dimensions: form.dimensions.trim() || null,
        delivery_override: form.delivery_override ? parseFloat(form.delivery_override) : null,
        delivery_overrides: form.delivery_overrides.length > 0 ? form.delivery_overrides.map(o => ({ route_id: o.route_id, price: parseFloat(o.price) })) : null,
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        tags: form.tags.length > 0 ? form.tags : null,
      };

      const { error } = await supabase.from('products').update(productData).eq('id', id);
      if (error) throw error;

      if (newImages.length > 0 || newImageUrls.length > 0) {
        setUploading(true);
        const startOrder = productImages.length;
        const allNew: string[] = [];

        for (let i = 0; i < newImages.length; i++) {
          const ext = newImages[i].file.name.split('.').pop();
          const filePath = `products/${id}/${Date.now()}-${i}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('products').upload(filePath, newImages[i].file);
          if (uploadError) { toast.error('Upload failed - storage bucket may not exist'); continue; }
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
          allNew.push(publicUrl);
        }

        for (let i = 0; i < newImageUrls.length; i++) {
          try {
            const response = await fetch(newImageUrls[i]);
            const blob = await response.blob();
            const ext = newImageUrls[i].split('.').pop()?.split('?')[0] || 'jpg';
            const filePath = `products/${id}/url-${Date.now()}-${i}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, blob);
            if (uploadError) { toast.error('URL image upload failed'); continue; }
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
            allNew.push(publicUrl);
          } catch {
            toast.error('Failed to download URL image');
          }
        }

        for (let i = 0; i < allNew.length; i++) {
          await supabase.from('product_images').insert({
            product_id: id,
            image_url: allNew[i],
            is_primary: productImages.length === 0 && i === 0,
            sort_order: startOrder + i,
          });
        }
        setUploading(false);
      }

      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Spinner size={36} /></div>;
  }

  const inputClass = 'w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
          <p className="text-sm text-white-muted mt-1">{form.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving || uploading} leftIcon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <Input label="Product Name" value={form.name} onChange={e => updateField('name', e.target.value)} error={errors.name} />
            <Input label="Slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} error={errors.slug} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Description</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={5} className={inputClass + ' resize-none'} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Short Description</label>
              <textarea value={form.short_description} onChange={e => updateField('short_description', e.target.value)} rows={2} className={inputClass + ' resize-none'} />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Price (Rs)" type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} error={errors.price} />
              <Input label="Compare Price" type="number" step="0.01" value={form.compare_price} onChange={e => updateField('compare_price', e.target.value)} />
              <Input label="Cost Price" type="number" step="0.01" value={form.cost_price} onChange={e => updateField('cost_price', e.target.value)} />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="SKU" value={form.sku} onChange={e => updateField('sku', e.target.value)} />
              <Input label="Barcode" value={form.barcode} onChange={e => updateField('barcode', e.target.value)} />
              <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={e => updateField('stock_quantity', e.target.value)} />
              <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={e => updateField('low_stock_threshold', e.target.value)} />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {productImages.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(img.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary"
                      title="Set as primary"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteImageId(img.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {img.is_primary && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-primary">Primary</span>
                  )}
                </div>
              ))}
              {newImages.map((img, i) => (
                <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white-muted hover:border-accent/50 hover:text-accent transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <div className="flex gap-2">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Or paste image URL and press Add" className="flex-1 h-10 rounded-lg glass px-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50" />
              <Button type="button" variant="secondary" onClick={() => { if (urlInput.trim()) { setNewImageUrls(prev => [...prev, urlInput.trim()]); setUrlInput(''); } }}>Add</Button>
            </div>
            {newImageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {newImageUrls.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).classList.add('hidden') }} />
                    <button type="button" onClick={() => setNewImageUrls(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">SEO</h2>
            <Input label="Meta Title" value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Meta Description</label>
              <textarea value={form.meta_description} onChange={e => updateField('meta_description', e.target.value)} rows={3} className={inputClass + ' resize-none'} />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Shipping & Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Weight (kg)" type="number" step="0.01" value={form.weight} onChange={e => updateField('weight', e.target.value)} />
              <Input label="Dimensions" value={form.dimensions} onChange={e => updateField('dimensions', e.target.value)} />
            </div>
            <Input label="Custom Delivery Fee (Rs)" type="number" step="0.01" value={form.delivery_override} onChange={e => updateField('delivery_override', e.target.value)} placeholder="Leave empty to use route overrides below" />
            <p className="text-xs text-white-muted -mt-2">If set, this overrides ALL route prices below.</p>
            {deliveryInfo && deliveryInfo.routes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Per-Route Delivery Overrides</p>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {deliveryInfo.routes.map((r) => {
                    const override = form.delivery_overrides.find(o => o.route_id === r.id);
                    const val = override ? override.price : '';
                    return (
                      <div key={r.id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <span className="text-xs text-white-muted whitespace-nowrap min-w-[140px]">{r.from} → {r.to}</span>
                        <span className="text-xs text-white-muted/60">Default: Rs {r.price.toLocaleString()}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={val}
                          onChange={e => {
                            const newOverrides = form.delivery_overrides.filter(o => o.route_id !== r.id);
                            if (e.target.value !== '') {
                              newOverrides.push({ route_id: r.id, price: e.target.value });
                            }
                            updateField('delivery_overrides', newOverrides);
                          }}
                          placeholder="Override"
                          className="ml-auto w-28 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white-muted/40 outline-none focus:ring-1 focus:ring-accent/50 text-right"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Organization</h2>
            <Select label="Category" options={[{ value: '', label: 'No category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} value={form.category_id} onValueChange={v => updateField('category_id', v)} />
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <div className="space-y-3">
              {[
                { key: 'is_featured', label: 'Featured' },
                { key: 'is_best_seller', label: 'Best Seller' },
                { key: 'is_new_arrival', label: 'New Arrival' },
                { key: 'is_active', label: 'Active' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[key]} onChange={e => updateField(key, e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/50" />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Tags</h2>
            <div className="flex gap-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag..." className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50" />
              <Button type="button" size="sm" variant="secondary" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={!!deleteImageId} onOpenChange={() => setDeleteImageId(null)} title="Delete Image" description="Are you sure you want to delete this image?" onConfirm={() => deleteImage(deleteImageId!)} />
    </form>
  );
}
