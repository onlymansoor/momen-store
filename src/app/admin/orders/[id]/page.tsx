'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import {
  formatPrice,
  formatDateTime,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/lib/utils';
import type { Order, OrderStatus, PaymentProof } from '@/lib/types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'payment_verification_pending', label: 'Payment Verification Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState('');
  const supabase = createClient();

  useEffect(() => { loadOrder(); }, [id]);

  async function loadOrder() {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*), payment_proof:payment_proofs(*)')
        .eq('id', id)
        .single();
      setOrder(data);
      setNotes(data?.notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: OrderStatus) {
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          payment_status: newStatus === 'delivered' ? 'paid' : order?.payment_status,
          is_paid: newStatus === 'delivered',
        })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        type: 'order_status',
        title: `Order #${order?.order_number} status updated`,
        message: `Status changed to ${getOrderStatusLabel(newStatus)}`,
        data: { order_id: id, status: newStatus },
      });

      toast.success(`Order status updated to ${getOrderStatusLabel(newStatus)}`);
      setConfirmStatus(null);
      loadOrder();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function verifyPayment(approved: boolean) {
    setStatusUpdating(true);
    try {
      if (approved) {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'paid', is_paid: true, order_status: 'accepted' })
          .eq('id', id);
        if (error) throw error;

        if (order?.payment_proof) {
          await supabase
            .from('payment_proofs')
            .update({ is_verified: true })
            .eq('id', order.payment_proof[0]?.id);
        }

        toast.success('Payment verified and order accepted');
      } else {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', order_status: 'cancelled' })
          .eq('id', id);
        toast.success('Payment rejected and order cancelled');
      }
      loadOrder();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function saveNotes() {
    try {
      await supabase.from('orders').update({ notes }).eq('id', id);
      toast.success('Notes saved');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Spinner size={36} /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 text-white-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Order not found</h2>
      </div>
    );
  }

  const proof = order.payment_proof?.[0] as PaymentProof | undefined;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/orders')} className="flex h-9 w-9 items-center justify-center rounded-lg glass text-white-muted hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Order #{order.order_number}</h1>
            <p className="text-sm text-white-muted">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <Badge className={getOrderStatusColor(order.order_status)}>
          {getOrderStatusLabel(order.order_status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-white">Order Items</h2>
            </div>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 overflow-hidden">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-white-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.product_name}</p>
                    <p className="text-xs text-white-muted mt-0.5">
                      {formatPrice(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-accent">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white-muted">Subtotal</span>
                <span className="text-white">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white-muted">Delivery Charges</span>
                <span className="text-white">{formatPrice(order.delivery_charges)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white-muted">Discount</span>
                  <span className="text-red-400">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-white/10">
                <span className="text-white">Total</span>
                <span className="text-accent">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-white">Notes</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              placeholder="Add order notes..."
            />
            <Button size="sm" className="mt-3" onClick={saveNotes}>Save Notes</Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-white">Customer</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-white font-medium">{order.customer_name}</p>
              <p className="text-white-muted">{order.customer_email}</p>
              <p className="text-white-muted">{order.customer_phone}</p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-white-muted text-xs font-medium">Shipping Address</p>
                <p className="text-white mt-1">{order.shipping_address}</p>
                <p className="text-white-muted text-xs mt-1">
                  {order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''}{order.shipping_zip ? ` - ${order.shipping_zip}` : ''}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-white">Payment</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white-muted">Method</span>
                <span className="text-white capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-muted">Status</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'pending' ? 'warning' : 'error'}>
                  {getPaymentStatusLabel ? getPaymentStatusLabel(order.payment_status) : order.payment_status}
                </Badge>
              </div>
            </div>
          </Card>

          {order.payment_method === 'easypaisa' && proof && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-white">Payment Proof</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-white/5">
                  <img src={proof.image_url} alt="Payment proof" className="w-full object-contain max-h-48" />
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-white-muted">Account: {proof.account_name}</p>
                  <p className="text-white-muted">Number: {proof.account_number}</p>
                </div>
                {!proof.is_verified && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => verifyPayment(true)} loading={statusUpdating} leftIcon={<CheckCircle className="h-4 w-4" />}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => verifyPayment(false)} loading={statusUpdating} leftIcon={<XCircle className="h-4 w-4" />}>
                      Reject
                    </Button>
                  </div>
                )}
                {proof.is_verified && (
                  <Badge variant="success">Verified</Badge>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Update Status</h2>
            <Select
              options={statusOptions}
              value={order.order_status}
              onValueChange={(v) => setConfirmStatus(v as OrderStatus)}
            />
            <Button
              size="sm"
              className="w-full mt-3"
              onClick={() => setConfirmStatus(order.order_status)}
              disabled={statusUpdating}
            >
              Update Status
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmStatus}
        onOpenChange={() => setConfirmStatus(null)}
        title="Update Order Status"
        description={`Are you sure you want to change status to "${getOrderStatusLabel(confirmStatus || '')}"?`}
        onConfirm={() => updateStatus(confirmStatus!)}
        loading={statusUpdating}
        variant="warning"
      />
    </div>
  );
}
