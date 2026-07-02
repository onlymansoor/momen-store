'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Image as ImageIcon, Upload, X, Check, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Spinner from '@/components/ui/Spinner';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import toast from 'react-hot-toast';

export default function LinkReviewPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
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
    async function verifyLink() {
      const supabase = createClient();
      const { data: linkData, error } = await supabase.from('review_links')
        .select('*, product:products(*)')
        .eq('id', linkId)
        .eq('is_used', false)
        .maybeSingle();
      
      if (error || !linkData) { setLoading(false); return; }
      
      setData(linkData);
      setLoading(false);
    }
    verifyLink();
  }, [linkId]);

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
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const ext = imageFiles[i].name.split('.').pop();
        const filePath = `reviews/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('reviews').upload(filePath, imageFiles[i]);
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }
      for (const url of imageUrls) uploadedUrls.push(url);

      // Call RPC to insert review and mark link as used
      const { error } = await supabase.rpc('submit_review_and_use_link', {
        p_link_id: linkId,
        p_product_id: data.product_id,
        p_rating: rating,
        p_comment: title ? `${title}: ${comment}` : comment,
        p_images: uploadedUrls
      });

      if (error) throw error;

      toast.success('Review submitted! Thank you.');
      router.push(`/products/${data.product.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size={32} /></div>;
  if (!data) return <div className="flex flex-col items-center justify-center min-h-[60vh] px-4"><h2 className="text-xl font-semibold text-white">404 - Link not found or already used</h2></div>;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
              {data.product.images?.[0]?.image_url ? (
                <ProgressiveImage src={data.product.images[0].image_url} alt={data.product.name} className="h-full w-full" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-white-muted" /></div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{data.product.name}</h1>
              <p className="text-sm text-accent">{formatPrice(data.product.price)}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white-muted mb-2">Your Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your name" className="w-full h-10 rounded-lg glass px-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent/50" required />
            </div>
            <div>
              <label className="block text-sm text-white-muted mb-2">Rating *</label>
              <StarRating rating={rating} interactive onChange={setRating} size={32} />
            </div>
            <div>
              <label className="block text-sm text-white-muted mb-1">Comment</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={4} className="w-full rounded-lg glass px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
            </div>
            <Button type="submit" size="lg" className="w-full" loading={submitting}>Submit Review</Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
