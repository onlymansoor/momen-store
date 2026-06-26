'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Building2, Upload, CheckCircle, ArrowLeft, ShieldCheck, Truck, ShoppingBag, MapPin, Info } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, cn } from '@/lib/utils';
import type { PaymentMethod } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const EASYPAISA_ACCOUNTS = [
  { name: 'Momen Store', number: '03334567890', bank: 'Easypaisa' },
];

interface City { id: string; name: string; }
interface Route { from_city: { id: string; name: string }; to_city: { id: string; name: string }; base_price: number; home_delivery: boolean; bilty_available: boolean; estimated_days: number; }
interface FurnitureMultiplier { category_name: string; additional_cost: number; }
interface QuantityRule { min_qty: number; max_qty: number; delivery_type: string; price: number; }
interface DeliverySetting { key: string; value: string; }

interface DeliveryData {
  cities: City[];
  routes: Route[];
  multipliers: FurnitureMultiplier[];
  rules: QuantityRule[];
  settings: DeliverySetting[];
}

function calcDeliveryCost(
  data: DeliveryData,
  cityId: string,
  totalQty: number,
  productOverrides: number[],
): { cost: number; routeFound: boolean; breakdown: string[] } {
  const breakdown: string[] = [];

  // Product-level delivery override takes highest priority
  const maxOverride = productOverrides.length > 0 ? Math.max(...productOverrides) : 0;
  if (maxOverride > 0) {
    breakdown.push(`Product delivery fee: ${formatPrice(maxOverride)}`);
    return { cost: maxOverride, routeFound: true, breakdown };
  }

  const useGlobalOnly = data.settings.find(s => s.key === 'use_global_only')?.value === 'true';
  const globalPriceSetting = data.settings.find(s => s.key === 'global_delivery_price');
  const globalPrice = globalPriceSetting ? Number(globalPriceSetting.value) : 0;

  // If global-only mode is on, skip routes entirely
  if (useGlobalOnly) {
    if (globalPrice > 0) {
      breakdown.push(`Global delivery rate: ${formatPrice(globalPrice)}`);
      return { cost: globalPrice, routeFound: true, breakdown };
    }
    const msg = data.settings.find(s => s.key === 'manual_quote_message')?.value || 'Delivery charges will be confirmed after order verification.';
    breakdown.push(msg);
    return { cost: 0, routeFound: false, breakdown };
  }

  const route = data.routes.find(r => r.to_city.id === cityId);
  if (!route) {
    if (globalPrice > 0) {
      breakdown.push(`Global delivery rate: ${formatPrice(globalPrice)}`);
      return { cost: globalPrice, routeFound: true, breakdown };
    }
    const msg = data.settings.find(s => s.key === 'manual_quote_message')?.value || 'Delivery charges will be confirmed after order verification.';
    breakdown.push(msg);
    return { cost: 0, routeFound: false, breakdown };
  }
  let baseCost = Number(route.base_price);
  breakdown.push(`Base delivery: ${formatPrice(baseCost)}`);

  const rule = data.rules.find(r => totalQty >= r.min_qty && totalQty <= r.max_qty && r.delivery_type === 'home');
  if (rule && Number(rule.price) > 0) {
    baseCost += Number(rule.price);
    breakdown.push(`Quantity surcharge (${totalQty} items): ${formatPrice(Number(rule.price))}`);
  }

  let multiplierTotal = 0;
  for (const m of data.multipliers) {
    multiplierTotal += m.additional_cost;
  }
  if (multiplierTotal > 0) {
    baseCost += multiplierTotal;
    breakdown.push(`Furniture surcharge: ${formatPrice(multiplierTotal)}`);
  }

  return { cost: baseCost, routeFound: true, breakdown };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [manualQuote, setManualQuote] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', phone2: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/delivery').then(r => r.json()).then(setDeliveryData).catch(() => {});
  }, []);

  const totalQty = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = getSubtotal();

  const productOverrides = useMemo(() => {
    return items.map(i => i.delivery_override).filter((d): d is number => d != null && d > 0);
  }, [items]);

  const deliveryInfo = useMemo(() => {
    if (!deliveryData || !selectedCityId) return { cost: 0, routeFound: false, breakdown: [] };
    return calcDeliveryCost(deliveryData, selectedCityId, totalQty, productOverrides);
  }, [deliveryData, selectedCityId, totalQty, productOverrides]);

  const delivery = deliveryInfo.cost;
  const total = subtotal + delivery;

  useEffect(() => {
    setManualQuote(selectedCityId !== '' && !deliveryInfo.routeFound);
  }, [selectedCityId, deliveryInfo.routeFound]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!selectedCityId) errs.city = 'Please select your city';
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

    let proofImageUrl: string | null = null;
    if (paymentProof) {
      const supabase = createClient();
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `payment-proofs/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentProof);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);
        proofImageUrl = urlData.publicUrl;
      } else {
        toast.error('Failed to upload payment proof');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_phone2: form.phone2,
          shipping_address: form.address,
          shipping_city: selectedCity?.name || '',
          items: items.map(item => ({
            product_id: item.product_id,
            product_name: item.name,
            product_image: item.image,
            price: item.price,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
          delivery_charges: manualQuote ? 0 : delivery,
          payment_proof: proofImageUrl ? {
            image_url: proofImageUrl,
            account_name: EASYPAISA_ACCOUNTS[0].name,
            account_number: EASYPAISA_ACCOUNTS[0].number,
          } : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Checkout</h1>
          <Link href="/auth/login" className="text-sm text-accent hover:text-accent-light transition-colors">
            Sign in for faster checkout
          </Link>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="John Doe" />
                <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="john@example.com" />
                <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} placeholder="03XX-XXXXXXX" />
                <Input label="Phone 2 (Optional)" type="tel" value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} placeholder="03XX-XXXXXXX" />
                <div className="relative">
                  <label className="block text-sm font-medium text-white-muted mb-1">City *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCityInput(val);
                        const match = deliveryData?.cities.find(c => c.name.toLowerCase() === val.toLowerCase());
                        if (match) {
                          setSelectedCityId(match.id);
                          setSelectedCity(match);
                        } else {
                          setSelectedCityId(val ? `custom-${val}` : '');
                          setSelectedCity(val ? { id: `custom-${val}`, name: val } : null);
                        }
                        setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      onFocus={() => setCityDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setCityDropdownOpen(false), 200)}
                      placeholder="Type your city name"
                      className={cn(
                        'w-full rounded-lg bg-[#1a1d2e] border border-white/10 px-3 py-2 pl-9 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-accent/50',
                        errors.city ? 'border-red-500' : ''
                      )}
                    />
                  </div>
                  {cityDropdownOpen && deliveryData && cityInput && deliveryData.cities.filter(c => c.name.toLowerCase().includes(cityInput.toLowerCase())).length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl bg-[#1a1d2e] border border-white/10 shadow-xl max-h-60 overflow-y-auto">
                      {deliveryData.cities
                        .filter(c => c.name.toLowerCase().includes(cityInput.toLowerCase()))
                        .map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onMouseDown={() => { setCityInput(city.name); setSelectedCityId(city.id); setSelectedCity(city); setCityDropdownOpen(false); }}
                            className={cn(
                              'w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-colors',
                              selectedCityId === city.id ? 'bg-accent/10 text-accent' : 'text-white hover:bg-white/10'
                            )}
                          >
                            <MapPin className="h-3.5 w-3.5 text-accent/50" />
                            {city.name}
                          </button>
                      ))}
                    </div>
                  )}
                  {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
                </div>
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

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button onClick={() => setPaymentMethod('cod')} className={cn('w-full flex items-center gap-3 rounded-xl p-4 glass transition-all text-left', paymentMethod === 'cod' ? 'border-accent/50 bg-accent/5' : 'hover:bg-white/5')}>
                  <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', paymentMethod === 'cod' ? 'border-accent' : 'border-white/20')}>
                    {paymentMethod === 'cod' && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </div>
                  <CreditCard className="h-5 w-5 text-accent" />
                  <div>
                    <span className="text-sm font-medium text-white">Cash on Delivery (COD)</span>
                    <p className="text-xs text-white-muted">Pay when you receive your order</p>
                  </div>
                </button>
                <button onClick={() => setPaymentMethod('easypaisa')} className={cn('w-full flex items-center gap-3 rounded-xl p-4 glass transition-all text-left', paymentMethod === 'easypaisa' ? 'border-accent/50 bg-accent/5' : 'hover:bg-white/5')}>
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
                    <div className="relative flex flex-col items-center justify-center rounded-xl glass p-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => document.getElementById('payment-proof')?.click()}>
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
                      <input id="payment-proof" type="file" accept="image/*" className="hidden" onChange={(e) => setPaymentProof(e.target.files?.[0] || null)} />
                    </div>
                    {errors.paymentProof && <p className="text-xs text-red-400 mt-1">{errors.paymentProof}</p>}
                  </div>
                </div>
              )}
            </div>

            <Button size="lg" variant="primary" className="w-full" loading={loading} onClick={handlePlaceOrder}>
              <CheckCircle className="h-5 w-5" />
              {manualQuote ? `Place Order - ${formatPrice(subtotal)} + Delivery (TBD)` : `Place Order - ${formatPrice(total)}`}
            </Button>
          </div>

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
                  {manualQuote ? (
                    <span className="text-amber-400 text-xs font-medium">TBD</span>
                  ) : selectedCityId ? (
                    <span className={delivery === 0 ? 'text-emerald-400' : 'text-white'}>
                      {delivery === 0 ? 'Free' : formatPrice(delivery)}
                    </span>
                  ) : (
                    <span className="text-white-muted text-xs">Select city</span>
                  )}
                </div>
                {deliveryInfo.breakdown.length > 0 && selectedCityId && (
                  <div className="space-y-1">
                    {deliveryInfo.breakdown.map((line, i) => (
                      <p key={i} className="text-[11px] text-white-muted/70 pl-3">{line}</p>
                    ))}
                  </div>
                )}
                {manualQuote && (
                  <div className="glass rounded-lg p-2 mt-1">
                    <p className="text-[11px] text-amber-400 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      Delivery charges for this location will be confirmed after order verification. Our team will contact you via WhatsApp.
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-accent">
                    {manualQuote ? `${formatPrice(subtotal)} + Delivery` : formatPrice(total)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-white-muted">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-accent" />
                  {selectedCityId
                    ? (deliveryInfo.routeFound
                      ? `Delivery to ${selectedCity?.name} — ${deliveryInfo.breakdown.length > 0 ? 'see details above' : formatPrice(delivery)}`
                      : 'Delivery charges confirmed after order')
                    : 'Select your city to see delivery charges'}
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
