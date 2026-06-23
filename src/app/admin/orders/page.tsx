'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { Order } from '@/lib/types';

const PAGE_SIZE = 15;

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_verification_pending', label: 'Verification Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('orders').select('*', { count: 'exact' });

      if (statusFilter !== 'all') query = query.eq('order_status', statusFilter);

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1).order('created_at', { ascending: false });

      const { data, count } = await query;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const tabContent = (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No orders found" description={search || statusFilter !== 'all' ? 'Try different filters' : 'No orders yet'} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Order #</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Items</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Payment</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <td className="py-3 px-4 text-white font-medium">#{order.order_number}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white">{order.customer_name}</p>
                        <p className="text-xs text-white-muted">{order.customer_phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white-muted">{order.items?.length || '-'}</td>
                    <td className="py-3 px-4 text-right text-accent font-medium">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-white-muted capitalize">{order.payment_method}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getOrderStatusColor(order.order_status)}>
                        {getOrderStatusLabel(order.order_status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-white-muted">{formatDateTime(order.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );

  const tabs = statusTabs.map(t => ({
    ...t,
    content: tabContent,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-sm text-white-muted mt-1">{totalCount} orders total</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full max-w-md rounded-lg glass pl-10 pr-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </Card>

      <Tabs
        tabs={tabs}
        value={statusFilter}
        onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
      />
    </div>
  );
}
