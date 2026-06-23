'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useCategories } from '@/hooks/useCategories';
import MobileNav from './MobileNav';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { categories } = useCategories();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold shrink-0">
              <span className="text-gradient">Momen</span>{' '}
              <span className="text-white">Store</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === link.href
                      ? 'text-accent'
                      : 'text-white-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div
                className="relative"
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
              >
                <button
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors',
                    categoriesOpen
                      ? 'text-accent'
                      : 'text-white-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  Categories
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      categoriesOpen && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1 w-48 rounded-xl glass p-1.5 shadow-2xl"
                    >
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-white-muted hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/wishlist"
                className="relative rounded-lg p-2 text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative rounded-lg p-2 text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                    {cartCount}
                  </span>
                )}
              </button>

              <Link
                href="/auth/login"
                className="rounded-lg p-2 text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden rounded-lg p-2 text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-16" />

      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={categories} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />
    </>
  );
}
