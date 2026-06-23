'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Building2, Upload, CheckCircle, ArrowLeft, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, cn } from '@/lib/utils';
import type { PaymentMethod } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const DELIVERY_CHARGES = 200;
const FREE_DELIVERY_THRESHOLD = 2000;
const EASYPAISA_ACCOUNTS = [
  { name: 'Momen Store', number: '03334567890', bank: 'Easypaisa' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getSubtotal();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_CHARGES;
  const total = subtotal + delivery;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (paymentMethod === 'easypaisa' && !paymentProof) errs.paymentProof = 'Payment screenshot is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let proofImageUrl: string | null = null;
    if (paymentProof) {
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `payment-proofs/${orderNumber}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, paymentProof);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        proofImageUrl = urlData.publicUrl;
      }
    }

    const { error: orderError } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      shipping_address: form.address,
      shipping_city: form.city,
      subtotal,
      delivery_charges: delivery,
      discount: 0,
      total,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'verification_pending',
      order_status: 'pending',
      notes: form.notes || null,
      ...(proofImageUrl ? {
        payment_proof: {
          image_url: proofImageUrl,
          account_name: EASYPAISA_ACCOUNTS[0].name,
          account_number: EASYPAISA_ACCOUNTS[0].number,
        },
      } : {}),
    });

    if (orderError) {
      toast.error('Failed to place order. Please try again.');
      setLoading(false);
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: orderNumber,
      product_id: item.product_id,
      product_name: item.name,
      product_image: item.image,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    for (const orderItem of orderItems) {
      await supabase.from('order_items').insert(orderItem);
    }

    clearCart();
    toast.success('Order placed successfully!');
    router.push(`/orders/${orderNumber}`);
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <ShoppingBag className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold text-white">Your cart is empty</h2>
          <p className="text-sm text-white-muted mt-1">Add items to your cart before checkout.</p>
          <Link href="/products">
            <Button variant="primary" className="mt-4">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Customer Info Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="John Doe" />
                <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="john@example.com" />
                <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} placeholder="03XX-XXXXXXX" />
                <Input label="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} placeholder="Karachi" />
              </div>
              <div className="mt-4">
                <Input label="Shipping Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} placeholder="House #, Street, Area" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-white-muted mb-1">Order Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special instructions for your order..."
                  rows={3}
                  className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl p-4 glass transition-all text-left',
                    paymentMethod === 'cod' ? 'border-accent/50 bg-accent/5' : 'hover:bg-white/5'
                  )}
                >
                  <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', paymentMethod === 'cod' ? 'border-accent' : 'border-white/20')}>
                    {paymentMethod === 'cod' && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </div>
                  <CreditCard className="h-5 w-5 text-accent" />
                  <div>
                    <span className="text-sm font-medium text-white">Cash on Delivery (COD)</span>
                    <p className="text-xs text-white-muted">Pay when you receive your order</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('easypaisa')}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl p-4 glass transition-all text-left',
                    paymentMethod === 'easypaisa' ? 'border-accent/50 bg-accent/5' : 'hover:bg-white/5'
                  )}
                >
                  <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', paymentMethod === 'easypaisa' ? 'border-accent' : 'border-white/20')}>
                    {paymentMethod === 'easypaisa' && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </div>
                  <Building2 className="h-5 w-5 text-accent" />
                  <div>
                    <span className="text-sm font-medium text-white">Easypaisa</span>
                    <p className="text-xs text-white-muted">Pay via Easypaisa account</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'easypaisa' && (
                <div className="mt-4 glass rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-medium text-white">Payment Instructions</h3>
                  <div className="text-sm text-white-muted space-y-1">
                    <p>Send payment to any of the following accounts:</p>
                    {EASYPAISA_ACCOUNTS.map((acc) => (
                      <div key={acc.number} className="glass rounded-lg p-3 mt-2">
                        <p className="text-white font-medium">{acc.name}</p>
                        <p className="text-accent font-semibold">{acc.number}</p>
                        <p className="text-xs text-white-muted">{acc.bank}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm text-white-muted mb-1">Upload Payment Screenshot *</label>
                    <div
                      className="relative flex flex-col items-center justify-center rounded-xl glass p-6 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => document.getElementById('payment-proof')?.click()}
                    >
                      {paymentProof ? (
                        <>
                          <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
                          <p className="text-sm text-white">{paymentProof.name}</p>
                          <p className="text-xs text-white-muted">Click to change</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-white-muted mb-2" />
                          <p className="text-sm text-white-muted">Click to upload screenshot</p>
                          <p className="text-xs text-white-muted">PNG, JPG up to 5MB</p>
                        </>
                      )}
                      <input
                        id="payment-proof"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      />
                    </div>
                    {errors.paymentProof && <p className="text-xs text-red-400 mt-1">{errors.paymentProof}</p>}
                  </div>
                </div>
              )}
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full"
              loading={loading}
              onClick={handlePlaceOrder}
            >
              <CheckCircle className="h-5 w-5" />
              Place Order - {formatPrice(total)}
            </Button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 space-y-4 sticky top-24">
              <h2 className="text-lg font-semibold text-white">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-white/5">
                      <img src={item.image || '/placeholder.svg'} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-white-muted">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-white">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white-muted">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white-muted">Delivery</span>
                  <span className={delivery === 0 ? 'text-emerald-400' : 'text-white'}>
                    {delivery === 0 ? 'Free' : formatPrice(delivery)}
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-white-muted">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-accent" />
                  Free delivery on orders over PKR 2,000
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
