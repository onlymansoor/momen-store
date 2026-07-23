'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { cn, formatPrice, formatDateTime, getOrderStatusColor, getOrderStatusLabel, getTimeAgo } from '@/lib/utils';
import type { Order, Product } from '@/lib/types';

interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  salesChange: number;
  ordersChange: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0,
    salesChange: 0, ordersChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      const [ordersRes, productsRes, customersRes, todayOrdersRes, yesterdayOrdersRes, notifRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total').gte('created_at', todayStr).eq('order_status', 'delivered'),
        supabase.from('orders').select('total').gte('created_at', yesterdayStr).lt('created_at', todayStr).eq('order_status', 'delivered'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const todaySales = (todayOrdersRes.data || []).reduce((s, o) => s + (o.total || 0), 0);
      const yesterdaySales = (yesterdayOrdersRes.data || []).reduce((s, o) => s + (o.total || 0), 0);

      let salesChange = 0;
      if (yesterdaySales > 0) salesChange = ((todaySales - yesterdaySales) / yesterdaySales) * 100;

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString();

      const ordersTwoDaysAgo = ordersRes.data?.filter(o => o.created_at >= twoDaysAgoStr && o.created_at < yesterdayStr) || [];
      const ordersToday = ordersRes.data?.filter(o => o.created_at >= todayStr) || [];
      let ordersChange = 0;
      if (ordersTwoDaysAgo.length > 0) ordersChange = ((ordersToday.length - ordersTwoDaysAgo.length) / ordersTwoDaysAgo.length) * 100;

      setStats({
        todaySales,
        totalOrders: ordersRes.data?.length || 0,
        totalProducts: productsRes.data?.length || 0,
        totalCustomers: customersRes.count || 0,
        salesChange,
        ordersChange,
      });

      setRecentOrders((ordersRes.data || []).slice(0, 10));

      setNotifications(notifRes.data || []);

      const lowStock = (productsRes.data || []).filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
      setLowStockProducts(lowStock);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size={40} />
      </div>
    );
  }

  const statCards = [
    { label: 'Today Sales', value: formatPrice(stats.todaySales), icon: DollarSign, change: stats.salesChange, color: 'text-emerald-400' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: Package, change: stats.ordersChange, color: 'text-blue-400' },
    { label: 'Total Products', value: stats.totalProducts.toString(), icon: ShoppingBag, change: null, color: 'text-purple-400' },
    { label: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users, change: null, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white-muted mt-1">Welcome back! Here is your store overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-white-muted">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    {card.change !== null && (
                      <div className="flex items-center gap-1 text-xs">
                        {card.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={card.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {Math.abs(card.change).toFixed(1)}%
                        </span>
                        <span className="text-white-muted">vs yesterday</span>
                      </div>
                    )}
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} bg-white/5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Sales Overview (Last 7 Days)</h2>
            <div className="flex items-end gap-2 h-48">
              {[40000, 55000, 38000, 62000, 48000, 71000, 52000].map((val, i) => {
                const max = 71000;
                const height = (val / max) * 100;
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-white-muted">{formatPrice(val)}</span>
                    <div className="w-full rounded-t-lg relative" style={{ height: `${height}%`, background: 'linear-gradient(to top, rgba(212,175,55,0.3), rgba(212,175,55,0.1))' }}>
                      <div className="absolute bottom-0 left-0 right-0 h-full rounded-t-lg bg-accent/60" style={{ height: `${height}%` }} />
                    </div>
                    <span className="text-xs text-white-muted">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin/orders'}>
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-white-muted font-medium">Order</th>
                    <th className="text-left py-3 px-2 text-white-muted font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-white-muted font-medium">Total</th>
                    <th className="text-left py-3 px-2 text-white-muted font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-white-muted font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 text-white font-medium">#{order.order_number}</td>
                      <td className="py-3 px-2 text-white-muted">{order.customer_name}</td>
                      <td className="py-3 px-2 text-accent font-medium">{formatPrice(order.total)}</td>
                      <td className="py-3 px-2">
                        <Badge className={getOrderStatusColor(order.order_status)}>
                          {getOrderStatusLabel(order.order_status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-white-muted text-xs">{getTimeAgo(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Low Stock Alerts</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-white-muted">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm text-white">{product.name}</p>
                      <p className="text-xs text-white-muted">SKU: {product.sku || 'N/A'}</p>
                    </div>
                    <span className="text-sm font-medium text-red-400">{product.stock_quantity} left</span>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full">
                    View {lowStockProducts.length - 5} more
                  </Button>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-white">Recent Notifications</h2>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-white-muted">No notifications yet</p>
              ) : (
                notifications.map((notif, i) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'p-2 rounded-lg',
                      i === 0 ? 'bg-accent/5 border border-accent/10' : 'bg-white/5'
                    )}
                  >
                    <p className={cn('text-sm', i === 0 ? 'text-white' : 'text-white-muted')}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-white-muted">{getTimeAgo(notif.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
