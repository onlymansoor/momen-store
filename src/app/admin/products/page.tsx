'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Image as ImageIcon,
  Package,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*, category:categories(*)', { count: 'exact' });

      if (search) query = query.ilike('name', `%${search}%`);
      if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter);
      if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count } = await query;
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page, supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, [supabase]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase.from('products').delete().eq('id', deleteId);
      setDeleteId(null);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-white-muted mt-1">{totalCount} products total</p>
        </div>
        <Button onClick={() => router.push('/admin/products/new')} leftIcon={<Plus className="h-4 w-4" />}>
          Add New Product
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full rounded-lg glass pl-10 pr-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <Select
            options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            value={categoryFilter}
            onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
            className="w-full sm:w-48"
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-full sm:w-40"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size={36} />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products found"
          description={search || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first product to start selling'}
          action={(!search && categoryFilter === 'all') ? { label: 'Add Product', onClick: () => router.push('/admin/products/new') } : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Price</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Stock</th>
                  <th className="text-center py-3 px-4 text-white-muted font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 overflow-hidden">
                          {product.images?.[0]?.image_url ? (
                            <img src={product.images[0].image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-white-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[200px]">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white-muted">{product.sku || '-'}</td>
                    <td className="py-3 px-4 text-white-muted">{product.category?.name || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-accent font-medium">{formatPrice(product.price)}</span>
                      {product.compare_price && (
                        <span className="text-xs text-white-muted line-through ml-1">{formatPrice(product.compare_price)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={product.stock_quantity <= product.low_stock_threshold ? 'text-red-400 font-medium' : 'text-white'}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={product.is_active ? 'success' : 'error'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${product.id}`); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(product.id); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
