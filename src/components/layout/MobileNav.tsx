'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Home, Package, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: { name: string; slug: string }[];
}

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Contact', href: '/contact', icon: Phone },
];

export default function MobileNav({ isOpen, onClose, categories = [] }: MobileNavProps) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="mobile-nav"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-72 glass border-r border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link href="/" onClick={onClose} className="text-xl font-bold">
                <span className="text-gradient">Momen</span>{' '}
                <span className="text-white">Store</span>
              </Link>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white-muted hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-white-muted hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              <div>
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4" />
                    Categories
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      categoriesOpen && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-9 mt-1 space-y-1">
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/products?category=${cat.slug}`}
                            onClick={onClose}
                            className="block rounded-lg px-3 py-2 text-sm text-white-muted hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="border-t border-white/10 p-4 space-y-2">
              <a
                href="https://wa.me/923345702532"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-white-muted hover:text-accent transition-colors"
              >
                <Phone className="h-4 w-4" />
                +92 334 5702532
              </a>
              <a
                href="mailto:info@Momenstore.com"
                className="flex items-center gap-3 text-sm text-white-muted hover:text-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                info@Momenstore.com
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
