'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, ArrowRight, Sparkles, Heart, Star, TrendingUp, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, cn, calculateDiscount, truncate } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useUIStore } from '@/lib/store/ui-store';
import type { Product, Category, Banner } from '@/lib/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ProgressiveImage from '@/components/ui/ProgressiveImage';

const PLACEHOLDER_IMG = '/placeholder.svg';

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem, isInWishlist } = useWishlistStore();
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);
  const primaryImage = product.images?.find((i) => i.is_primary)?.image_url || product.images?.[0]?.image_url || PLACEHOLDER_IMG;
  const discount = calculateDiscount(product.price, product.compare_price || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass aspect-square mb-3">
          <ProgressiveImage
            src={primaryImage}
            alt={product.name}
            className="h-full w-full transition-transform duration-500 group-hover:scale-110"
          />
          {discount > 0 && (
            <Badge variant="gold" className="absolute top-2 left-2">
              -{discount}%
            </Badge>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              const item = { product_id: product.id, name: product.name, price: product.price, image: primaryImage, stock: product.stock_quantity };
              isInWishlist(product.id) ? removeItem(product.id) : addToWishlist(item);
            }}
            className="absolute top-2 right-2 rounded-full p-1.5 glass text-white-muted hover:text-red-400 transition-colors"
          >
            <Star className={cn('h-4 w-4', isInWishlist(product.id) && 'fill-red-400 text-red-400')} />
          </button>
        </div>
      </Link>
      <div className="space-y-1.5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-accent">{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-white-muted line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-xs text-white-muted">{product.average_rating.toFixed(1)}</span>
          <span className="text-xs text-white-muted">({product.review_count})</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-1"
          onClick={() => {
            addItem({ product_id: product.id, name: product.name, price: product.price, image: primaryImage, stock: product.stock_quantity, delivery_override: product.delivery_override, delivery_overrides: product.delivery_overrides });
            setCartOpen(true);
          }}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        href={`/products?category=${category.slug}`}
        className="group relative block overflow-hidden rounded-2xl glass aspect-[4/3]"
      >
        <ProgressiveImage
          src={category.image_url || PLACEHOLDER_IMG}
          alt={category.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
          <span className="text-xs text-accent inline-flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Shop Now <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="hidden sm:flex items-center gap-1 text-sm text-accent hover:text-accent-light transition-colors"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [featuredRes, bestSellersRes, newArrivalsRes, categoriesRes, bannerRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*), images:product_images(*)').eq('is_active', true).eq('is_featured', true).limit(8),
        supabase.from('products').select('*, category:categories(*), images:product_images(*)').eq('is_active', true).eq('is_best_seller', true).limit(8),
        supabase.from('products').select('*, category:categories(*), images:product_images(*)').eq('is_active', true).eq('is_new_arrival', true).limit(8),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(6),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(1).single(),
      ]);
      if (featuredRes.data) setFeatured(featuredRes.data);
      if (bestSellersRes.data) setBestSellers(bestSellersRes.data);
      if (newArrivalsRes.data) setNewArrivals(newArrivalsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (bannerRes.data) setBanner(bannerRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={banner?.image_url ? { backgroundImage: `url(${banner.image_url})` } : {}}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <Badge variant="gold" className="mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Premium Collection
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {banner?.title || 'Discover Your'}
              <br />
              <span className="text-gradient">{banner?.subtitle || 'Perfect Style'}</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white-muted max-w-lg leading-relaxed">
              Shop the latest trends with premium quality products at unbeatable prices. Free delivery across Pakistan.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/products">
                <Button size="lg" variant="primary">
                  <ShoppingBag className="h-5 w-5" />
                  Shop Now
                </Button>
              </Link>
              <Link href="/products?sort=newest">
                <Button size="lg" variant="outline">
                  New Arrivals
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Featured Products" subtitle="Handpicked just for you" href="/products?sort=newest" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Shop by Category" subtitle="Find exactly what you need" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Best Sellers" subtitle="Most popular products this month" href="/products?sort=popular" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="New Arrivals" subtitle="Fresh drops you'll love" href="/products?sort=newest" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {newArrivals.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Strip */}
      <section className="py-12 border-y border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Package, label: 'Fast Delivery', desc: '' },
              { icon: TrendingUp, label: 'Best Prices', desc: 'Factory direct pricing' },
              { icon: Star, label: 'Premium Quality', desc: '100% authentic products' },
              { icon: Heart, label: 'Happy Customers', desc: '1000+ happy customers all over the country' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center glass rounded-2xl p-6"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                  {item.desc && <p className="text-xs text-white-muted mt-1">{item.desc}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


    </div>
  );
}
