'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, Star } from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/placeholder.svg';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (item: { product_id: string; name: string; price: number; image: string }) => {
    addItem({ ...item, stock: 99 });
    toast.success('Added to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Wishlist' }]} className="mb-6" />
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="Your wishlist is empty"
            description="Save items you love to your wishlist and find them easily later."
            action={{ label: 'Browse Products', onClick: () => window.location.href = '/products' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Wishlist' }]} className="mb-6" />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            My Wishlist ({items.length})
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.product_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="group">
                <Link
                  href={`/products/${item.product_id}`}
                  className="relative block overflow-hidden rounded-2xl glass aspect-square mb-3"
                >
                  <ProgressiveImage
                    src={item.image || PLACEHOLDER_IMG}
                    alt={item.name}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem(item.product_id);
                      toast.success('Removed from wishlist');
                    }}
                    className="absolute top-2 right-2 rounded-full p-2 glass text-red-400 bg-red-500/10 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>
                <div className="space-y-1.5">
                  <Link href={`/products/${item.product_id}`}>
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm font-semibold text-accent">{formatPrice(item.price)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
