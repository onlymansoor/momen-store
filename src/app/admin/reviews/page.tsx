'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  MessageSquare,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime, truncate } from '@/lib/utils';
import type { Review } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<(Review & { product?: { name: string }; customer?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadReviews();
    loadProducts();
  }, [filter]);

  async function loadProducts() {
    const { data } = await supabase.from('products').select('id, name').eq('is_active', true);
    setProducts(data || []);
  }

  async function generateLink() {
    if (!selectedProductId) return;
    const { data, error } = await supabase.from('review_links').insert({ product_id: selectedProductId }).select('id').single();
    if (error) toast.error(error.message);
    else {
      const url = `${window.location.origin}/review/${data.id}`;
      setGeneratedLink(url);
      toast.success('Link generated');
    }
  }

  async function loadReviews() {
    setLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select('*, product:products(name), customer:customers(name)')
        .order('created_at', { ascending: false });

      if (filter === 'approved') query = query.eq('is_approved', true);
      else if (filter === 'pending') query = query.eq('is_approved', false);

      const { data } = await query;
      setReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Review approved'); loadReviews(); }
  }

  async function handleReject(id: string) {
    const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Review rejected'); loadReviews(); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase.from('reviews').delete().eq('id', deleteId);
      toast.success('Review deleted');
      setDeleteId(null);
      loadReviews();
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
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-sm text-white-muted mt-1">{reviews.length} reviews</p>
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Reviews' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending Approval' },
          ]}
          value={filter}
          onValueChange={setFilter}
          className="w-44"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Generate Review Link</h2>
        <div className="flex gap-4 items-end">
          <Select
            label="Select Product"
            options={products.map(p => ({ value: p.id, label: p.name }))}
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            className="flex-1"
          />
          <Button onClick={generateLink} disabled={!selectedProductId}>Generate Link</Button>
        </div>
        {generatedLink && (
          <div className="mt-4 flex gap-2">
            <Input value={generatedLink} readOnly className="flex-1" />
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success('Copied!'); }}>Copy</Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No reviews" description={filter !== 'all' ? 'No reviews match this filter' : 'No reviews yet'} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-white-muted'}`} />
                        ))}
                      </div>
                      <Badge variant={review.is_approved ? 'success' : 'warning'}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-white font-medium">
                      {review.product && <span className="text-accent">{review.product.name}</span>}
                    </p>
                    {review.title && <p className="text-sm text-white font-medium mt-1">{review.title}</p>}
                    {review.comment && (
                      <p className="text-sm text-white-muted mt-1 leading-relaxed">{review.comment}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-white-muted">
                      <span>{review.customer?.name || 'Anonymous'}</span>
                      <span>{formatDateTime(review.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!review.is_approved && (
                      <button onClick={() => handleApprove(review.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Approve">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {review.is_approved && (
                      <button onClick={() => handleReject(review.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-orange-400 hover:bg-orange-500/10 transition-colors" title="Reject">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setDeleteId(review.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Review" description="Are you sure? This action cannot be undone." onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
