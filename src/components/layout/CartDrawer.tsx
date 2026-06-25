'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDER_IMG = '/placeholder.svg';

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md glass border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-white">
                  Cart ({itemCount})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white-muted hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-white/10 mb-4" />
                  <p className="text-white-muted">Your cart is empty</p>
                  <Link
                    href="/products"
                    onClick={onClose}
                    className="mt-4 inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-primary font-medium hover:from-accent-light hover:to-accent-dark transition-all duration-300"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-3 glass rounded-xl p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-accent mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="rounded-lg p-1 text-white-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-white w-6 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="rounded-lg p-1 text-white-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="ml-auto rounded-lg p-1 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white-muted">Subtotal</span>
                  <span className="text-white font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full text-center py-2.5 rounded-lg glass glass-hover text-white hover:text-accent transition-colors"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-primary font-medium hover:from-accent-light hover:to-accent-dark transition-all duration-300"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
