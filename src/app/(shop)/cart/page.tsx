'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus, Ticket, CreditCard } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const DELIVERY_CHARGES = 200;
const FREE_DELIVERY_THRESHOLD = 2000;
const PLACEHOLDER_IMG = '/placeholder.svg';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_CHARGES;
  const total = subtotal + delivery;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    // Placeholder: apply coupon logic
    await new Promise((r) => setTimeout(r, 500));
    toast.error('Invalid coupon code');
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Cart' }]} className="mb-6" />
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Your cart is empty"
            description="Looks like you haven't added anything yet. Start shopping and find something you love!"
            action={{ label: 'Start Shopping', onClick: () => window.location.href = '/products' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Cart' }]} className="mb-6" />

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.product_id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass rounded-2xl p-4 flex gap-4"
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-white/5">
                  <img
                    src={item.image || PLACEHOLDER_IMG}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-sm font-medium text-white hover:text-accent transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-accent font-semibold mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center rounded-lg glass overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center text-white-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center text-sm font-medium text-white border-x border-white/10">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="flex h-8 w-8 items-center justify-center text-white-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => {
                          removeItem(item.product_id);
                          toast.success('Item removed from cart');
                        }}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass rounded-2xl p-6 space-y-4 sticky top-24">
              <h2 className="text-lg font-semibold text-white">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white-muted">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white-muted">Delivery</span>
                  <span className={delivery === 0 ? 'text-emerald-400' : 'text-white'}>
                    {delivery === 0 ? 'Free' : formatPrice(delivery)}
                  </span>
                </div>
                {subtotal < FREE_DELIVERY_THRESHOLD && subtotal > 0 && (
                  <p className="text-xs text-white-muted">
                    Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="glass rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-accent shrink-0" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white-muted outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="text-xs text-accent hover:text-accent-light font-medium disabled:opacity-50"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" variant="primary" className="w-full">
                  <CreditCard className="h-5 w-5" />
                  Proceed to Checkout
                </Button>
              </Link>

              <Link
                href="/products"
                className="flex items-center justify-center gap-1 text-sm text-white-muted hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
