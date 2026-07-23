'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Package, CreditCard, Truck, RotateCcw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import { createClient } from '@/lib/supabase/client';

interface FAQ { q: string; a: string; }

interface FAQCategory {
  icon: typeof HelpCircle;
  label: string;
  faqs: FAQ[];
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<{ cat: number; faq: number } | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('delivery_settings').select('key,value').then(({ data }) => {
      if (data) {
        const map = Object.fromEntries(data.map(s => [s.key, s.value]));
        const msg = map.manual_quote_message || '';
        const price = map.global_delivery_price || '';
        setDeliveryInfo(msg || (price ? `A standard delivery charge of PKR ${price} applies to all orders.` : 'Delivery charges vary by location and will be confirmed after order verification.'));
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>;

  const FAQ_DATA: FAQCategory[] = [
    {
      icon: Package,
      label: 'Orders',
      faqs: [
        { q: 'How do I place an order?', a: 'Browse our products, select the items you want, add them to your cart, and proceed to checkout. Fill in your shipping details and choose your preferred payment method to complete the order.' },
        { q: 'Can I modify or cancel my order?', a: 'You can cancel your order if it is still in "Pending" status. Go to your orders page and click on the order to find the cancel option. Once the order is accepted or shipped, it cannot be modified.' },
        { q: 'How do I track my order?', a: 'Once your order is shipped, a tracking number will be provided. You can view it on your order details page under the tracking section.' },
      ],
    },
    {
      icon: Truck,
      label: 'Shipping',
      faqs: [
        { q: 'What are the delivery charges?', a: deliveryInfo },
        { q: 'How long does delivery take?', a: 'Delivery typically takes 3-7 business days depending on your location. Major cities like Karachi, Lahore, and Islamabad usually receive orders within 2-4 business days.' },
        { q: 'Do you deliver internationally?', a: 'Currently, we only deliver within Pakistan. We hope to expand internationally in the future.' },
      ],
    },
    {
      icon: CreditCard,
      label: 'Payment',
      faqs: [
        { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD) and Easypaisa. For Easypaisa payments, please send the amount to our official Easypaisa account and upload the transaction screenshot during checkout.' },
        { q: 'Is it safe to pay online?', a: 'Yes, we use secure payment processing. Your payment information is encrypted and protected.' },
        { q: 'When do I need to pay for my order?', a: 'For COD, payment is collected at the time of delivery. For Easypaisa, payment is required before the order is processed.' },
      ],
    },
    {
      icon: RotateCcw,
      label: 'Returns & Exchanges',
      faqs: [
        { q: 'What is your return policy?', a: 'We offer a 7-day easy return policy from the date of delivery. Items must be unused, in original packaging, and in the same condition as received.' },
        { q: 'How do I initiate a return?', a: 'Contact our customer support within 7 days of receiving your order. Provide your order number and the reason for return, and we will guide you through the process.' },
        { q: 'Who pays for return shipping?', a: 'Return shipping costs are borne by the customer unless the item is defective or incorrect.' },
      ],
    },
    {
      icon: User,
      label: 'Account',
      faqs: [
        { q: 'How do I create an account?', a: 'Click on the "Sign Up" link and fill in your name, email, phone number, and password. You can then manage your profile, view orders, and save your addresses.' },
        { q: 'I forgot my password. What should I do?', a: 'On the login page, click "Forgot Password" and follow the instructions sent to your email to reset it.' },
        { q: 'Can I update my personal information?', a: 'Yes, go to your Account page and click "Edit" to update your name, phone number, address, and city.' },
      ],
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'FAQ' }]} className="mb-6" />

        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-10 w-10 text-accent mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-sm text-white-muted mt-2 max-w-lg mx-auto">
            Find answers to common questions about our products, shipping, and policies.
          </p>
        </div>

        <div className="space-y-8">
          {FAQ_DATA.map((category, catIdx) => {
            const Icon = category.icon;
            return (
              <div key={category.label} className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{category.label}</h2>
                </div>
                <div className="space-y-2">
                  {category.faqs.map((faq, faqIdx) => {
                    const isOpen = openIndex?.cat === catIdx && openIndex?.faq === faqIdx;
                    return (
                      <div key={faqIdx} className="glass rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : { cat: catIdx, faq: faqIdx })}
                          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
                        >
                          <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-accent transition-transform duration-200',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 text-sm text-white-muted leading-relaxed">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}