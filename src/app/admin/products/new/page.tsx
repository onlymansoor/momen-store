'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  Upload,
  Plus,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { Category } from '@/lib/types';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    stock_quantity: '0',
    low_stock_threshold: '5',
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: false,
    is_active: true,
    meta_title: '',
    meta_description: '',
    weight: '',
    dimensions: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, [supabase]);

  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !prev.slug) {
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
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.price || parseFloat(form.price) < 0) errs.price = 'Valid price is required';
    if (!form.stock_quantity || parseInt(form.stock_quantity) < 0) errs.stock_quantity = 'Valid stock is required';
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
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        tags: form.tags.length > 0 ? form.tags : null,
        average_rating: 0,
        review_count: 0,
        sold_count: 0,
      };

      const { data: product, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      if (images.length > 0 && product) {
        setUploading(true);
        for (let i = 0; i < images.length; i++) {
          const ext = images[i].file.name.split('.').pop();
          const filePath = `products/${product.id}/${Date.now()}-${i}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, images[i].file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          await supabase.from('product_images').insert({
            product_id: product.id,
            image_url: publicUrl,
            is_primary: i === 0,
            sort_order: i,
          });
        }
        setUploading(false);
      }

      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Product</h1>
          <p className="text-sm text-white-muted mt-1">Create a new product for your store</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <Input label="Product Name" value={form.name} onChange={e => updateField('name', e.target.value)} error={errors.name} placeholder="Enter product name" />
            <Input label="Slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} error={errors.slug} placeholder="product-url-slug" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Description</label>
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                rows={5}
                className={inputClass + ' resize-none'}
                placeholder="Full product description..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Short Description</label>
              <textarea
                value={form.short_description}
                onChange={e => updateField('short_description', e.target.value)}
                rows={2}
                className={inputClass + ' resize-none'}
                placeholder="Brief product description..."
              />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Price (Rs)" type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} error={errors.price} placeholder="0.00" />
              <Input label="Compare Price (Rs)" type="number" step="0.01" value={form.compare_price} onChange={e => updateField('compare_price', e.target.value)} placeholder="0.00" />
              <Input label="Cost Price (Rs)" type="number" step="0.01" value={form.cost_price} onChange={e => updateField('cost_price', e.target.value)} placeholder="0.00" />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="SKU" value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="SKU-001" />
              <Input label="Barcode" value={form.barcode} onChange={e => updateField('barcode', e.target.value)} placeholder="Barcode" />
              <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={e => updateField('stock_quantity', e.target.value)} error={errors.stock_quantity} />
              <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={e => updateField('low_stock_threshold', e.target.value)} />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-primary">Primary</span>
                  )}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">SEO</h2>
            <Input label="Meta Title" value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} placeholder="SEO title" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white-muted">Meta Description</label>
              <textarea
                value={form.meta_description}
                onChange={e => updateField('meta_description', e.target.value)}
                rows={3}
                className={inputClass + ' resize-none'}
                placeholder="SEO meta description..."
              />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Shipping</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Weight (kg)" type="number" step="0.01" value={form.weight} onChange={e => updateField('weight', e.target.value)} placeholder="0.00" />
              <Input label="Dimensions" value={form.dimensions} onChange={e => updateField('dimensions', e.target.value)} placeholder="10 x 5 x 3 cm" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Organization</h2>
            <Select
              label="Category"
              options={[{ value: '', label: 'No category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={form.category_id}
              onValueChange={v => updateField('category_id', v)}
            />
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
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => updateField(key, e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/50"
                  />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Tags</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
