'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MonthlySales {
  month: string;
  total: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sold_count: number;
  revenue: number;
}

interface CategorySales {
  name: string;
  total: number;
  count: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const supabase = createClient();

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [ordersRes, productsRes, catRes] = await Promise.all([
        supabase.from('orders').select('total, order_status, created_at').order('created_at', { ascending: false }),
        supabase.from('products').select('name, sold_count, price').order('sold_count', { ascending: false }).limit(10),
        supabase.from('categories').select('name, id, products:products(price)'),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      const revenue = orders.filter(o => o.order_status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
      setTotalRevenue(revenue);
      setTotalOrders(orders.length);
      setPendingOrders(orders.filter(o => o.order_status === 'pending' || o.order_status === 'payment_verification_pending').length);
      setAvgOrderValue(orders.length > 0 ? revenue / orders.length : 0);

      const monthly: Record<string, MonthlySales> = {};
      orders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { month: key, total: 0, orders: 0 };
        if (o.order_status === 'delivered') monthly[key].total += o.total || 0;
        monthly[key].orders += 1;
      });
      setMonthlySales(Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).slice(-12));

      const top = (products as any[]).map(p => ({
        name: p.name,
        sold_count: p.sold_count || 0,
        revenue: (p.sold_count || 0) * (p.price || 0),
      })).filter(p => p.sold_count > 0);
      setTopProducts(top);

      const catSales: CategorySales[] = (catRes.data || []).map((cat: any) => ({
        name: cat.name,
        total: (cat.products || []).reduce((s: number, p: any) => s + (p.price || 0), 0),
        count: cat.products?.length || 0,
      }));
      setCategorySales(catSales);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Spinner size={40} /></div>;
  }

  const maxMonthly = Math.max(...monthlySales.map(m => m.total), 1);

  const orderStatuses = [
    { label: 'Delivered', value: totalOrders - pendingOrders, color: 'bg-emerald-500' },
    { label: 'Pending', value: pendingOrders, color: 'bg-yellow-500' },
    { label: 'Other', value: totalOrders - (totalOrders - pendingOrders) - pendingOrders, color: 'bg-blue-500' },
  ];
  const statusTotal = orderStatuses.reduce((s, o) => s + o.value, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white-muted mt-1">Your store performance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Orders', value: totalOrders.toString(), icon: Package, color: 'text-blue-400' },
          { label: 'Pending Orders', value: pendingOrders.toString(), icon: ShoppingBag, color: 'text-yellow-400' },
          { label: 'Avg Order Value', value: formatPrice(avgOrderValue), icon: TrendingUp, color: 'text-accent' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white-muted">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} bg-white/5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h2>
          <div className="flex items-end gap-2 h-48">
            {monthlySales.map((m, i) => {
              const height = (m.total / maxMonthly) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-white-muted">{formatPrice(m.total)}</span>
                  <div className="w-full rounded-t-lg relative" style={{ height: `${Math.max(height, 4)}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-accent/60 to-accent/20" style={{ height: '100%' }} />
                  </div>
                  <span className="text-[10px] text-white-muted">{m.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Orders by Status</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulativePct = 0;
                  const circumference = 2 * Math.PI * 15.9;
                  return orderStatuses.map((status, i) => {
                    const pct = Math.max(0, (status.value / statusTotal) * 100);
                    const offset = circumference - (pct / 100) * circumference;
                    const prevOffset = circumference - (cumulativePct / 100) * circumference;
                    cumulativePct += pct;
                    return (
                      <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={status.color.replace('bg-emerald-500', '#10B981').replace('bg-yellow-500', '#EAB308').replace('bg-blue-500', '#3B82F6')} strokeWidth="3" strokeDasharray={`${circumference}`} strokeDashoffset={prevOffset} />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">{totalOrders}</span>
                <span className="text-xs text-white-muted">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              {orderStatuses.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${s.color}`} />
                  <span className="text-sm text-white-muted">{s.label}</span>
                  <span className="text-sm text-white font-medium ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Top Selling Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-white-muted">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-white-muted w-5">{i + 1}.</span>
                    <span className="text-sm text-white truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-white-muted">{p.sold_count} sold</span>
                    <span className="text-sm text-accent font-medium">{formatPrice(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Sales by Category</h2>
          </div>
          {categorySales.length === 0 ? (
            <p className="text-sm text-white-muted">No categories yet</p>
          ) : (
            <div className="space-y-3">
              {categorySales.map((cat, i) => {
                const maxCat = Math.max(...categorySales.map(c => c.total), 1);
                const width = (cat.total / maxCat) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{cat.name}</span>
                      <span className="text-accent">{formatPrice(cat.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Sales Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white-muted font-medium">Month</th>
                <th className="text-right py-3 px-4 text-white-muted font-medium">Orders</th>
                <th className="text-right py-3 px-4 text-white-muted font-medium">Revenue</th>
                <th className="text-right py-3 px-4 text-white-muted font-medium">Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {monthlySales.slice().reverse().map((m) => (
                <tr key={m.month} className="border-b border-white/5">
                  <td className="py-3 px-4 text-white">{m.month}</td>
                  <td className="py-3 px-4 text-right text-white">{m.orders}</td>
                  <td className="py-3 px-4 text-right text-accent font-medium">{formatPrice(m.total)}</td>
                  <td className="py-3 px-4 text-right text-white-muted">{m.orders > 0 ? formatPrice(m.total / m.orders) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
