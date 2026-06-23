'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, cn, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { Order } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Orders' }]} className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="No orders yet"
            description="You haven't placed any orders yet. Start shopping and your orders will appear here."
            action={{ label: 'Start Shopping', onClick: () => window.location.href = '/products' }}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/orders/${order.order_number}`}
                      className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="text-xs text-white-muted">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', getOrderStatusColor(order.order_status))}>
                      {getOrderStatusLabel(order.order_status)}
                    </span>
                    <span className="text-sm font-semibold text-white">{formatPrice(order.total)}</span>
                    <Link href={`/orders/${order.order_number}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
