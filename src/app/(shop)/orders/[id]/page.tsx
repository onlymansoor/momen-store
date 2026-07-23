'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ChevronLeft, MapPin, CreditCard, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, cn, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderItem } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import toast from 'react-hot-toast';

const ORDER_STATUS_FLOW: Record<string, number> = {
  pending: 0,
  payment_verification_pending: 1,
  accepted: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'accepted', label: 'Order Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const PLACEHOLDER_IMG = '/placeholder.svg';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const supabase = createClient();
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', id)
        .single();
      if (orderData) {
        setOrder(orderData);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderData.order_number);
        if (itemsData) setItems(itemsData);
        if (typeof window !== 'undefined') {
          const fbq = (window as any).fbq;
          if (fbq) {
            fbq('track', 'Purchase', {
              value: orderData.total_amount || 0,
              currency: 'PKR',
              content_ids: itemsData?.map(i => i.product_id) || [],
              content_type: 'product',
            });
          }
        }
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'cancelled' })
      .eq('order_number', id);
    if (error) {
      toast.error('Failed to cancel order');
    } else {
      toast.success('Order cancelled');
      setOrder((prev) => prev ? { ...prev, order_status: 'cancelled' as const } : null);
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] glass rounded-2xl mx-auto max-w-lg p-12">
        <Package className="h-12 w-12 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white">Order not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>
          <ChevronLeft className="h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_FLOW[order.order_status] ?? -1;
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Orders', href: '/orders' },
            { label: `#${order.order_number}` },
          ]}
          className="mb-6"
        />

        {/* Order Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Order #{order.order_number}
              </h1>
              <p className="text-sm text-white-muted mt-1">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border w-fit', getOrderStatusColor(order.order_status))}>
              {getOrderStatusLabel(order.order_status)}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled ? (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-6">Order Status</h2>
            <div className="relative">
              <div className="absolute top-4 left-4 bottom-4 w-0.5 bg-white/10" />
              <div className="space-y-6 relative">
                {STATUS_STEPS.map((step, i) => {
                  const completed = currentStep >= ORDER_STATUS_FLOW[step.key];
                  const active = currentStep === i;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          completed ? 'border-accent bg-accent/20' : 'border-white/20 bg-transparent'
                        )}
                      >
                        <div className={cn('h-2.5 w-2.5 rounded-full', completed ? 'bg-accent' : 'bg-white/20')} />
                      </div>
                      <div className="pt-1">
                        <p className={cn('text-sm font-medium', completed ? 'text-accent' : 'text-white-muted')}>
                          {step.label}
                        </p>
                        {active && currentStep === i && (
                          <p className="text-xs text-white-muted mt-0.5">Current</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 mb-6 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
            <h2 className="text-lg font-semibold text-white">Order Cancelled</h2>
            <p className="text-sm text-white-muted mt-1">This order has been cancelled.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Details */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Customer Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white-muted w-20">Name:</span>
                <span className="text-white">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white-muted w-20">Email:</span>
                <span className="text-white">{order.customer_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white-muted w-20">Phone:</span>
                <span className="text-white">{order.customer_phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-white-muted mt-0.5 shrink-0" />
                <span className="text-white">{order.shipping_address}, {order.shipping_city}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Payment Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" />
                <span className="text-white-muted w-24">Method:</span>
                <span className="text-white capitalize">{order.payment_method}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white-muted w-24">Status:</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'pending' ? 'warning' : 'info'}>
                  {order.payment_status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
                <div className="flex justify-between"><span className="text-white-muted">Subtotal</span><span className="text-white">{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-white-muted">Delivery</span><span className="text-white">{formatPrice(order.delivery_charges)}</span></div>
                {order.discount > 0 && <div className="flex justify-between"><span className="text-white-muted">Discount</span><span className="text-emerald-400">-{formatPrice(order.discount)}</span></div>}
                <div className="flex justify-between border-t border-white/10 pt-2"><span className="font-medium text-white">Total</span><span className="font-bold text-accent">{formatPrice(order.total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Items ({items.length})</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/5">
                  <ProgressiveImage
                    src={item.product_image || PLACEHOLDER_IMG}
                    alt={item.product_name}
                    className="h-full w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.product_name}</p>
                  <p className="text-xs text-white-muted">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                </div>
                <span className="text-sm font-semibold text-white">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking ID */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Tracking ID</h2>
          <p className="text-sm text-white-muted">Use this ID to track your order:</p>
          <p className="text-lg font-bold text-accent tracking-wider">#{order.order_number}</p>
          {order.tracking_number && (
            <p className="text-sm text-white-muted mt-2">Courier Tracking: <span className="text-white font-medium">{order.tracking_number}</span></p>
          )}
        </div>

        {/* Cancel Order */}
        {order.order_status === 'pending' && (
          <div className="text-center">
            <Button
              variant="danger"
              loading={cancelling}
              onClick={handleCancelOrder}
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
