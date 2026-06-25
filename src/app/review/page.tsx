'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Image as ImageIcon, Upload, X, Check, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const productId = searchParams.get('product');

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (!orderId || !productId) { setLoading(false); return; }
    async function verify() {
      const supabase = createClient();
      const { data: orderData } = await supabase.from('orders').select('*, order_items!inner(*)').eq('id', orderId).single();
      if (!orderData) { setLoading(false); return; }
      const hasProduct = orderData.order_items?.some((item: any) => item.product_id === productId);
      if (!hasProduct) { setLoading(false); return; }

      const { data: productData } = await supabase.from('products').select('*').eq('id', productId).single();
      if (!productData) { setLoading(false); return; }

      // Check if review already exists for this order + product
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingReview) {
        setLoading(false);
        setDuplicate(true);
        return;
      }

      setOrder(orderData);
      setProduct(productData);
      setCustomerName(orderData.customer_name || '');
      setValid(true);
      setLoading(false);
    }
    verify();
  }, [orderId, productId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    if (!customerName.trim()) { toast.error('Please enter your name'); return; }
    setSubmitting(true);
    const supabase = createClient();

    try {
      const { data: review, error } = await supabase.from('reviews').insert({
        product_id: productId,
        order_id: orderId,
        customer_name: customerName.trim(),
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        is_approved: false,
      }).select().single();

      if (error) throw error;

      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const ext = imageFiles[i].name.split('.').pop();
        const filePath = `reviews/${review.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('reviews').upload(filePath, imageFiles[i]);
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }
      for (const url of imageUrls) uploadedUrls.push(url);

      if (uploadedUrls.length > 0) {
        const imageRows = uploadedUrls.map((url, i) => ({
          review_id: review.id,
          image_url: url,
          sort_order: i,
        }));
        await supabase.from('review_images').insert(imageRows);
      }

      toast.success('Review submitted! Thank you for your feedback.');
      router.push(`/products/${product.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size={32} /></div>;
  }

  if (!valid) {
    if (duplicate) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Check className="h-12 w-12 text-accent mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Review Already Submitted</h2>
          <p className="text-sm text-white-muted text-center max-w-md">You have already submitted a review for this order and product. Thank you for your feedback!</p>
          <Link href="/" className="mt-6 text-accent hover:underline text-sm">Back to Store</Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingBag className="h-12 w-12 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Invalid Review Link</h2>
        <p className="text-sm text-white-muted text-center max-w-md">This review link is invalid or expired. Please contact the store for a valid review link.</p>
        <Link href="/" className="mt-6 text-accent hover:underline text-sm">Back to Store</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8">
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
              {product.images?.[0]?.image_url ? (
                <img src={product.images[0].image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-white-muted" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{product.name}</h1>
              <p className="text-sm text-accent">{formatPrice(product.price)}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Write a Review</h2>
          <p className="text-sm text-white-muted mb-6">Share your experience with this product</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white-muted mb-2">Your Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your name" className="w-full h-10 rounded-lg glass px-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50" required />
            </div>

            <div>
              <label className="block text-sm text-white-muted mb-2">Rating *</label>
              <StarRating rating={rating} interactive onChange={setRating} size={32} />
            </div>

            <div>
              <label className="block text-sm text-white-muted mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Great product!" className="w-full h-10 rounded-lg glass px-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50" />
            </div>

            <div>
              <label className="block text-sm text-white-muted mb-1">Comment</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={4} className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
            </div>

            <div>
              <label className="block text-sm text-white-muted mb-2">Photos (optional)</label>
              <div className="flex gap-2 mb-3">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-white/5">
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"><X className="h-2 w-2 text-white" /></button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-white-muted hover:border-accent/50 hover:text-accent transition-colors">
                  <Upload className="h-5 w-5" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </label>
              </div>
              <div className="flex gap-2">
                <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Or paste image URL" className="flex-1 h-9 rounded-lg glass px-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50" />
                <Button type="button" variant="secondary" size="sm" onClick={() => { if (urlInput.trim()) { setImageUrls(prev => [...prev, urlInput.trim()]); setUrlInput(''); } }}>Add</Button>
              </div>
              {imageUrls.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {imageUrls.map((url, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-white-muted bg-white/5 rounded px-2 py-1">
                      URL {i + 1} <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))} className="text-red-400">x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              <Check className="h-4 w-4" /> Submit Review
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
