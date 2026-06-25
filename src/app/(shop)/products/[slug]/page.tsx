'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, ChevronLeft, Star, Truck, ShieldCheck, RotateCcw, MessageCircle, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, cn, calculateDiscount, truncate } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useUIStore } from '@/lib/store/ui-store';
import type { Product, Review } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import QuantitySelector from '@/components/ui/QuantitySelector';
import StarRating from '@/components/ui/StarRating';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/placeholder.svg';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem, isInWishlist } = useWishlistStore();
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);


  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: productData } = await supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)')
        .eq('slug', slug)
        .single();

      if (productData) {
        setProduct(productData);
        if (productData.category_id) {
          const { data: relatedData } = await supabase
            .from('products')
            .select('*, category:categories(*), images:product_images(*)')
            .eq('category_id', productData.category_id)
            .eq('is_active', true)
            .neq('id', productData.id)
            .limit(4);
          if (relatedData) setRelated(relatedData);
        }
      }
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, customer:customers(id, name), images:review_images(*)')
        .eq('product_id', productData?.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (reviewsData) setReviews(reviewsData);

      setLoading(false);
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] glass rounded-2xl mx-auto max-w-lg p-12">
        <ShoppingBag className="h-12 w-12 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white">Product not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/products')}>
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.sort((a, b) => a.sort_order - b.sort_order)
    : [{ image_url: PLACEHOLDER_IMG, alt_text: product.name }];
  const discount = calculateDiscount(product.price, product.compare_price || 0);
  const primaryImage = product.images?.find((i) => i.is_primary)?.image_url || product.images?.[0]?.image_url || PLACEHOLDER_IMG;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products' },
            ...(product.category ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }] : []),
            { label: product.name },
          ]}
          className="mb-6"
        />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-2xl glass overflow-hidden"
            >
              <img
                src={images[selectedImage]?.image_url || PLACEHOLDER_IMG}
                alt={images[selectedImage]?.alt_text || product.name}
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
              />
              {discount > 0 && (
                <Badge variant="gold" className="absolute top-4 left-4 text-sm px-3 py-1">
                  -{discount}% OFF
                </Badge>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                      i === selectedImage ? 'border-accent' : 'border-transparent glass opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `View ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs text-accent hover:text-accent-light uppercase tracking-wider"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">{product.name}</h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <StarRating rating={product.average_rating} size={18} />
                  <span className="text-sm text-white-muted ml-1">
                    {product.average_rating.toFixed(1)} ({product.review_count} reviews)
                  </span>
                </div>
                <span className="text-white/20">|</span>
                <span className="text-sm text-white-muted">{product.sold_count} sold</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-accent">{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-lg text-white-muted line-through">{formatPrice(product.compare_price)}</span>
                  <Badge variant="gold">Save {formatPrice(product.compare_price - product.price)}</Badge>
                </>
              )}
            </div>

            {product.short_description && (
              <p className="text-sm text-white-muted leading-relaxed">{product.short_description}</p>
            )}

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-white-muted">
                <Truck className="h-4 w-4 text-accent" />
                Fast & Secure Delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-white-muted">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Quality Guaranteed
              </div>
              <div className="flex items-center gap-2 text-sm text-white-muted">
                <Star className="h-4 w-4 text-accent" />
                1000+ Happy Customers
              </div>
            </div>

            <div className="flex items-center gap-4">
              <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock_quantity} />
              <Button
                size="lg"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  addItem({
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image: primaryImage,
                    stock: product.stock_quantity,
                    delivery_override: product.delivery_override,
                  });
                  setCartOpen(true);
                  toast.success('Added to cart!');
                }}
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </Button>
              <button
                onClick={() => {
                  const item = { product_id: product.id, name: product.name, price: product.price, image: primaryImage, stock: product.stock_quantity };
                  if (isInWishlist(product.id)) {
                    removeItem(product.id);
                    toast.success('Removed from wishlist');
                  } else {
                    addToWishlist(item);
                    toast.success('Added to wishlist!');
                  }
                }}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg glass transition-all',
                  isInWishlist(product.id) ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-white-muted hover:text-red-400'
                )}
              >
                <Heart className={cn('h-5 w-5', isInWishlist(product.id) && 'fill-red-400')} />
              </button>
            </div>

            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <p className="text-sm text-red-400">Only {product.stock_quantity} left in stock</p>
            )}
            {product.stock_quantity === 0 && (
              <p className="text-sm text-red-400 font-medium">Out of stock</p>
            )}

            <div className="glass rounded-2xl p-4 space-y-2 text-sm">
              {product.sku && (
                <div className="flex items-center gap-2">
                  <span className="text-white-muted">SKU:</span>
                  <span className="text-white">{product.sku}</span>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white-muted">Tags:</span>
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="gold">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Reviews */}
        <div className="mt-12 lg:mt-16">
          <Tabs
            tabs={[
              {
                value: 'description',
                label: 'Description',
                content: (
                  <div className="prose prose-invert max-w-none">
                    <div className="glass rounded-2xl p-6 sm:p-8">
                      <p className="text-sm text-white-muted leading-relaxed whitespace-pre-line">
                        {product.description || 'No description available.'}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                value: 'reviews',
                label: `Reviews (${reviews.length})`,
                content: (
                  <div className="space-y-8">
                    {/* Existing Reviews */}
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <div className="glass rounded-2xl p-8 text-center">
                          <MessageCircle className="mx-auto h-8 w-8 text-white/20 mb-3" />
                          <p className="text-sm text-white-muted">No reviews yet. Be the first!</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-accent">
                                    {(review as any).customer_name?.charAt(0) || review.customer?.name?.charAt(0) || 'A'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {(review as any).customer_name || review.customer?.name || 'Anonymous'}
                                  </p>
                                  <p className="text-xs text-white-muted">
                                    {new Date(review.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <StarRating rating={review.rating} size={16} />
                            </div>
                            {review.title && (
                              <h4 className="text-sm font-medium text-white mt-2">{review.title}</h4>
                            )}
                            {review.comment && (
                              <p className="text-sm text-white-muted mt-1 leading-relaxed">{review.comment}</p>
                            )}
                            {(review as any).images?.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {(review as any).images.map((img: any) => (
                                  <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer" className="h-16 w-16 rounded-lg overflow-hidden bg-white/5 hover:ring-2 ring-accent/50 transition-all">
                                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            )}
                            <Badge variant="info" className="mt-2 text-[10px]">Verified Purchase</Badge>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Review CTA */}
                    <div className="glass rounded-2xl p-6 sm:p-8 text-center">
                      <Camera className="mx-auto h-10 w-10 text-accent/60 mb-3" />
                      <h3 className="text-lg font-semibold text-white mb-2">Have You Purchased This Product?</h3>
                      <p className="text-sm text-white-muted max-w-md mx-auto mb-4">
                        Only verified buyers can leave reviews. After your purchase, you'll receive a custom review link with your order. Share your experience and upload photos!
                      </p>
                      <Link href={`/products?category=${product.category?.slug || ''}`}>
                        <Button variant="primary">
                          <ShoppingBag className="h-4 w-4" /> Buy Now to Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-12 lg:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((rp) => {
                const rpImage = rp.images?.find((i) => i.is_primary)?.image_url || rp.images?.[0]?.image_url || PLACEHOLDER_IMG;
                return (
                  <Link key={rp.id} href={`/products/${rp.slug}`} className="group">
                    <div className="relative overflow-hidden rounded-2xl glass aspect-square mb-3">
                      <img src={rpImage} alt={rp.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                      {calculateDiscount(rp.price, rp.compare_price || 0) > 0 && (
                        <Badge variant="gold" className="absolute top-2 left-2">-{calculateDiscount(rp.price, rp.compare_price || 0)}%</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">{rp.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-accent">{formatPrice(rp.price)}</span>
                      {rp.compare_price && rp.compare_price > rp.price && (
                        <span className="text-xs text-white-muted line-through">{formatPrice(rp.compare_price)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
