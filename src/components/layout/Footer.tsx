'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Globe, Camera, Hash } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Admin Panel', href: '/admin/login' },
];

const CUSTOMER_LINKS = [
  { label: 'Track Order', href: '/track-order' },
  { label: 'Shipping Info', href: '/shipping' },
  { label: 'Returns & Exchanges', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

const SOCIAL_LINKS = [
  { icon: Globe, href: '#', label: 'Facebook' },
  { icon: Camera, href: '#', label: 'Instagram' },
  { icon: Hash, href: '#', label: 'Twitter' },
];

export default function Footer() {
  const { categories } = useCategories();

  return (
    <footer className="relative border-t border-white/10 bg-secondary/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-gradient">Momen Store</span>
            </Link>
            <p className="text-sm text-white-muted leading-relaxed">
              Your premier destination for quality products in Pakistan. Shop with confidence and enjoy the best deals.
            </p>
            <div className="space-y-2 text-sm text-white-muted">
              <a href={`tel:${process.env.NEXT_PUBLIC_SITE_URL || ''}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="h-3.5 w-3.5 text-accent" /> +92 334 5702532
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-accent" /> Pakistan
              </div>
              <a href="mailto:info@Momenstore.com" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="h-3.5 w-3.5 text-accent" /> info@Momenstore.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white-muted hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} className="text-sm text-white-muted hover:text-accent transition-colors">
                    {cat.name}
                  </Link>
                </li>
              )) : (
                <li className="text-sm text-white-muted/50">No categories yet</li>
              )}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Service</h3>
            <ul className="space-y-2">
              {CUSTOMER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white-muted hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white-muted">&copy; {new Date().getFullYear()} Momen Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a key={social.label} href={social.href} className="text-white-muted hover:text-accent transition-colors" aria-label={social.label}>
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white-muted">We Accept:</span>
            <span className="px-3 py-1 text-xs font-medium rounded-md glass text-accent">COD</span>
            <span className="px-3 py-1 text-xs font-medium rounded-md glass text-accent">Easypaisa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
