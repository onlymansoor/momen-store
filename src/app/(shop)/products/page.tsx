'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Star, ShoppingBag, Grid3X3, List, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, cn, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import type { Product, Category, ProductFilters, SortOption } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import ProgressiveImage from '@/components/ui/ProgressiveImage';

const PLACEHOLDER_IMG = '/placeholder.svg';
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: 999999 },
  { label: 'Under PKR 1,000', min: 0, max: 1000 },
  { label: 'PKR 1,000 - 2,500', min: 1000, max: 2500 },
  { label: 'PKR 2,500 - 5,000', min: 2500, max: 5000 },
  { label: 'Over PKR 5,000', min: 5000, max: 999999 },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Best Selling' },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem, isInWishlist } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    sort: (searchParams.get('sort') as SortOption) || 'newest',
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  };

  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    router.push('/products');
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)', { count: 'exact' })
        .eq('is_active', true);

      if (filters.category) {
        query = query.eq('category.slug', filters.category);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice && filters.maxPrice < 999999) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.rating) {
        query = query.gte('average_rating', filters.rating);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      switch (filters.sort) {
        case 'price_asc': query = query.order('price', { ascending: true }); break;
        case 'price_desc': query = query.order('price', { ascending: false }); break;
        case 'rating': query = query.order('average_rating', { ascending: false }); break;
        case 'popular': query = query.order('sold_count', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const from = ((filters.page || 1) - 1) * (filters.limit || 12);
      const to = from + (filters.limit || 12) - 1;
      query = query.range(from, to);

      const [productsRes, categoriesRes] = await Promise.all([
        query,
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (productsRes.count !== null) setTotalCount(productsRes.count);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    }
    fetchData();
  }, [searchParams.toString()]);

  const totalPages = Math.ceil(totalCount / (filters.limit || 12));
  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice, filters.rating, filters.search].filter(Boolean).length;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Products' }]} className="mb-6" />

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Products</h1>
            {!loading && (
              <p className="text-sm text-white-muted mt-1">{totalCount} products found</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('rounded-lg p-2 transition-colors', viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-white-muted hover:text-white')}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('rounded-lg p-2 transition-colors', viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-white-muted hover:text-white')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="glass rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-accent hover:text-accent-light">
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <SearchBar
                value={filters.search || ''}
                onChange={(v) => updateFilter('search', v || undefined)}
                placeholder="Search products..."
              />

              {/* Categories */}
              <div>
                <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilter('category', undefined)}
                    className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors', !filters.category ? 'bg-accent/10 text-accent' : 'text-white-muted hover:text-white hover:bg-white/5')}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors', filters.category === cat.slug ? 'bg-accent/10 text-accent' : 'text-white-muted hover:text-white hover:bg-white/5')}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Price Range</h4>
                <div className="space-y-1">
                  {PRICE_RANGES.map((range) => {
                    const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                    return (
                      <button
                        key={range.label}
                        onClick={() => {
                          if (isActive) {
                            updateFilter('minPrice', undefined);
                            updateFilter('maxPrice', undefined);
                          } else {
                            updateFilter('minPrice', range.min.toString());
                            updateFilter('maxPrice', range.max.toString());
                          }
                        }}
                        className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors', isActive ? 'bg-accent/10 text-accent' : 'text-white-muted hover:text-white hover:bg-white/5')}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Minimum Rating</h4>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateFilter('rating', filters.rating === r ? undefined : r.toString())}
                      className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors', filters.rating === r ? 'bg-accent/10 text-accent' : 'text-white-muted hover:text-white hover:bg-white/5')}
                    >
                      <Star className={cn('h-3.5 w-3.5', filters.rating === r ? 'fill-accent' : '')} />
                      <span>{r} & up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full glass px-4 py-2.5 text-sm text-white shadow-2xl"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {filters.category && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    {categories.find((c) => c.slug === filters.category)?.name || filters.category}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('category', undefined)} />
                  </Badge>
                )}
                {filters.minPrice && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    {formatPrice(filters.minPrice)} - {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Any'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { updateFilter('minPrice', undefined); updateFilter('maxPrice', undefined); }} />
                  </Badge>
                )}
                {filters.rating && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    {filters.rating}+ Stars
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('rating', undefined)} />
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    &ldquo;{filters.search}&rdquo;
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('search', undefined)} />
                  </Badge>
                )}
                {activeFilterCount > 1 && (
                  <button onClick={clearFilters} className="text-xs text-accent hover:text-accent-light">
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-4">
              <Select
                options={SORT_OPTIONS}
                value={filters.sort}
                onValueChange={(v) => updateFilter('sort', v)}
                className="w-44"
              />
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size={32} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl">
                <ShoppingBag className="mx-auto h-12 w-12 text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white">No products found</h3>
                <p className="text-sm text-white-muted mt-1">Try adjusting your filters</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                      : 'space-y-4'
                  )}
                >
                  {products.map((product, i) => {
                    const primaryImage = product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || PLACEHOLDER_IMG;
                    const discount = calculateDiscount(product.price, product.compare_price || 0);

                    if (viewMode === 'list') {
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="glass rounded-2xl p-4 flex gap-4"
                        >
                          <Link href={`/products/${product.slug}`} className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden">
                            <ProgressiveImage src={primaryImage} alt={product.name} className="h-full w-full" />
                            {discount > 0 && <Badge variant="gold" className="absolute top-1 left-1">-{discount}%</Badge>}
                          </Link>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <Link href={`/products/${product.slug}`} className="text-sm font-medium text-white hover:text-accent transition-colors line-clamp-2">
                                {product.name}
                              </Link>
                              <p className="text-xs text-white-muted mt-1 line-clamp-2">{product.short_description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                                <span className="text-xs text-white-muted">{product.average_rating.toFixed(1)} ({product.review_count})</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span className="text-sm font-semibold text-accent">{formatPrice(product.price)}</span>
                                {product.compare_price && product.compare_price > product.price && (
                                  <span className="text-xs text-white-muted line-through ml-2">{formatPrice(product.compare_price)}</span>
                                )}
                              </div>
                              <Button size="sm" onClick={() => addItem({ product_id: product.id, name: product.name, price: product.price, image: primaryImage, stock: product.stock_quantity })}>
                                <ShoppingBag className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link href={`/products/${product.slug}`} className="group block">
                          <div className="relative overflow-hidden rounded-2xl glass aspect-square mb-3">
                            <ProgressiveImage src={primaryImage} alt={product.name} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                            {discount > 0 && <Badge variant="gold" className="absolute top-2 left-2">-{discount}%</Badge>}
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
                            <h3 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">{product.name}</h3>
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
                          <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => addItem({ product_id: product.id, name: product.name, price: product.price, image: primaryImage, stock: product.stock_quantity })}>
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Add to Cart
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={filters.page || 1}
                  totalPages={totalPages}
                  onPageChange={(page) => updateFilter('page', page.toString())}
                  className="mt-8 justify-center"
                />
              </>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileFilterOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 z-50 h-full w-full max-w-sm glass border-r border-white/10 shadow-2xl overflow-y-auto p-6 lg:hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Filters</h2>
                  <button onClick={() => setMobileFilterOpen(false)} className="rounded-full p-1.5 text-white-muted hover:bg-white/10 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <SearchBar value={filters.search || ''} onChange={(v) => updateFilter('search', v || undefined)} placeholder="Search products..." />
                  <div>
                    <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Category</h4>
                    <div className="space-y-1">
                      <button onClick={() => updateFilter('category', undefined)} className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors', !filters.category ? 'bg-accent/10 text-accent' : 'text-white-muted')}>
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button key={cat.id} onClick={() => updateFilter('category', cat.slug)} className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors', filters.category === cat.slug ? 'bg-accent/10 text-accent' : 'text-white-muted')}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Price Range</h4>
                    <div className="space-y-1">
                      {PRICE_RANGES.map((range) => (
                        <button key={range.label} onClick={() => { updateFilter('minPrice', range.min.toString()); updateFilter('maxPrice', range.max.toString()); }} className={cn('w-full text-left px-3 py-1.5 rounded-lg text-sm', filters.minPrice === range.min ? 'bg-accent/10 text-accent' : 'text-white-muted')}>
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white-muted uppercase tracking-wider mb-2">Rating</h4>
                    <div className="space-y-1">
                      {[4, 3, 2, 1].map((r) => (
                        <button key={r} onClick={() => updateFilter('rating', filters.rating === r ? undefined : r.toString())} className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm', filters.rating === r ? 'bg-accent/10 text-accent' : 'text-white-muted')}>
                          <Star className={cn('h-3.5 w-3.5', filters.rating === r ? 'fill-accent' : '')} /> {r} & up
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="primary" className="w-full" onClick={() => setMobileFilterOpen(false)}>Apply Filters</Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
