'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, MapPin, CheckCircle, Truck, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import toast from 'react-hot-toast';

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: MapPin,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const supabase = createClient();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) { toast.error('Please enter an order number'); return; }
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, items:order_items(*)').eq('order_number', orderNumber.trim()).single();
    if (data) setOrder(data);
    else toast.error('Order not found');
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Track Order' }]} className="mb-6" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Track Your Order</h1>
          <p className="text-sm text-white-muted mb-6">Enter your order number to check the status</p>

          <form onSubmit={handleTrack} className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="e.g. ORD-2024-001"
              className="flex-1 h-12 rounded-lg glass px-4 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
            />
            <Button type="submit" size="lg" loading={loading}>
              <Search className="h-4 w-4" /> Track
            </Button>
          </form>
        </motion.div>

        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Order #{order.order_number}</h2>
                <p className="text-xs text-white-muted">{new Date(order.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">{STATUS_LABELS[order.order_status] || order.order_status}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, i) => {
                  const Icon = STATUS_ICONS[status];
                  const completed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.order_status) >= i;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${completed ? 'bg-accent text-primary' : 'bg-white/5 text-white-muted'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs ${completed ? 'text-white' : 'text-white-muted'}`}>{STATUS_LABELS[status]}</span>
                      {i < 4 && <div className={`h-0.5 w-8 ${['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.order_status) > i ? 'bg-accent' : 'bg-white/10'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 overflow-hidden">
                      {item.product_image && <ProgressiveImage src={item.product_image} alt="" className="h-full w-full" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.product_name}</p>
                      <p className="text-xs text-white-muted">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.tracking_number && (
              <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-xs text-white-muted">Tracking Number</p>
                <p className="text-sm font-medium text-accent">{order.tracking_number}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
