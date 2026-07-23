'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';

export default function ShippingPage() {
  const [message, setMessage] = useState('');
  const [globalPrice, setGlobalPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('delivery_settings').select('key,value').then(({ data }) => {
      if (data) {
        const map = Object.fromEntries(data.map(s => [s.key, s.value]));
        setMessage(map.manual_quote_message || '');
        setGlobalPrice(map.global_delivery_price || '');
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>;

  const deliveryInfo = message || (
    globalPrice
      ? `A standard delivery charge of PKR ${globalPrice} applies to all orders.`
      : 'Delivery charges vary by location and will be confirmed after order verification.'
  );

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Shipping Info' }]} className="mb-6" />

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Shipping Information</h1>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Delivery Charges</h2>
            <p className="text-sm text-white-muted leading-relaxed">{deliveryInfo}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Processing Time</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              Orders are processed within 1-2 business days after confirmation. You will receive a confirmation email with your order details and tracking information once your order is shipped.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Cash on Delivery (COD)</h2>
            <p className="text-sm text-white-muted leading-relaxed">
              We offer Cash on Delivery for all orders across Pakistan. Please ensure you have the exact amount ready when receiving your order. Our delivery partner will provide a receipt for your payment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
