'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Grid3X3,
  Package,
  Users,
  Image as ImageIcon,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Search,
  Truck,
  MapPin,
  Route,
  Ruler,
  Hash,
} from 'lucide-react';
import { cn, getTimeAgo } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useStoreSettings } from '@/lib/store/settings-store';
import type { Admin } from '@/lib/types';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

interface AdminContextType {
  admin: Admin | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  admin: null,
  loading: true,
  logout: async () => {},
});

export const useAdmin = () => useContext(AdminContext);

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: ShoppingBag },
  { label: 'Categories', href: '/admin/categories', icon: Grid3X3 },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Admins', href: '/admin/admins', icon: Shield },
];

const deliveryItems = [
  { label: 'Cities', href: '/admin/cities', icon: MapPin },
  { label: 'Delivery Routes', href: '/admin/delivery-routes', icon: Route },
  { label: 'Furniture Multipliers', href: '/admin/furniture-multipliers', icon: Ruler },
  { label: 'Quantity Rules', href: '/admin/quantity-rules', icon: Hash },
  { label: 'Delivery Settings', href: '/admin/delivery-settings', icon: Truck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { logo_url, store_name, load: loadSettings } = useStoreSettings();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    loadSettings();
    if (!isLoginPage) checkAdmin();
    else setLoading(false);
  }, [isLoginPage]);

  async function checkAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/admin/login');
      return;
    }
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();
    if (!data) {
      await supabase.auth.signOut();
      router.replace('/admin/login');
      return;
    }
    setAdmin(data);
    setLoading(false);
  }

  async function loadNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }

  async function markNotifRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).is('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  useEffect(() => {
    if (!isLoginPage && !loading) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoginPage, loading]);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as HTMLElement)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ admin, loading, logout }}>
      <div className="flex h-screen bg-primary overflow-hidden">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col glass border-r border-white/10 transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-20',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className={cn('flex items-center h-16 px-4 border-b border-white/10', sidebarOpen ? 'justify-between' : 'justify-center')}>
            <Link href="/admin" className="flex items-center gap-3">
              {logo_url ? (
                <Image src={logo_url} alt={store_name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary font-bold text-sm">
                  MS
                </div>
              )}
              {sidebarOpen && <span className="text-lg font-bold text-white">{store_name}</span>}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group',
                    isActive
                      ? 'text-accent bg-accent/10 border-l-2 border-accent'
                      : 'text-white-muted hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-accent' : 'text-white-muted group-hover:text-white')} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
            {sidebarOpen && (
              <div className="pt-4 pb-2">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white-muted/50">
                  Delivery Management
                </p>
              </div>
            )}
            {deliveryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group',
                    isActive
                      ? 'text-accent bg-accent/10 border-l-2 border-accent'
                      : 'text-white-muted hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-accent' : 'text-white-muted group-hover:text-white')} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className={cn('flex flex-1 flex-col transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
          <header className="flex h-16 items-center justify-between gap-4 glass border-b border-white/10 px-4 lg:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-full rounded-lg glass pl-10 pr-3 text-sm text-white placeholder:text-white-muted outline-none transition-all focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-primary/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {notifications.some(n => !n.is_read) && (
                        <button onClick={markAllRead} className="text-xs text-accent hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-white-muted text-center py-8">No notifications yet</p>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => { markNotifRead(notif.id); if (notif.data?.order_id) router.push(`/admin/orders/${notif.data.order_id}`); }}
                            className={cn(
                              'w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
                              !notif.is_read && 'bg-accent/5'
                            )}
                          >
                            <p className={cn('text-sm', !notif.is_read ? 'text-white font-medium' : 'text-white-muted')}>
                              {notif.title}
                            </p>
                            {notif.message && (
                              <p className="text-xs text-white-muted/70 mt-0.5">{notif.message}</p>
                            )}
                            <p className="text-[10px] text-white-muted/50 mt-1">{getTimeAgo(notif.created_at)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent text-sm font-semibold">
                      {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-white">{admin?.name}</span>
                  </button>
                }
                items={[
                  { label: 'Profile', icon: <User className="h-4 w-4" />, onClick: () => {} },
                  { label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => router.push('/admin/settings') },
                  { separator: true, label: '', onClick: () => {} },
                  { label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: logout, danger: true },
                ]}
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
