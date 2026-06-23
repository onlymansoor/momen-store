'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Package, Heart, LogOut, Edit3, Save, Smartphone, Mail, MapPin, ShoppingBag, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel, getInitials, cn } from '@/lib/utils';
import type { Customer, Order } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '' });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .single();
        if (customerData) {
          setCustomer(customerData);
          setForm({
            name: customerData.name || '',
            email: customerData.email || '',
            phone: customerData.phone || '',
            address: customerData.address || '',
            city: customerData.city || '',
          });
        }
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (ordersData) setOrders(ordersData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('customers')
      .update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
      })
      .eq('id', customer.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
      setCustomer({ ...customer, ...form });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Account' }]} className="mb-6" />
          <div className="flex flex-col items-center justify-center glass rounded-2xl p-12">
            <User className="h-12 w-12 text-white/20 mb-4" />
            <h2 className="text-xl font-semibold text-white">Not signed in</h2>
            <p className="text-sm text-white-muted mt-1">Sign in to view your account.</p>
            <Link href="/auth/login">
              <Button variant="primary" className="mt-4">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Account' }]} className="mb-6" />

        {/* Profile Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xl font-bold">
              {getInitials(customer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{customer.name}</h1>
              <p className="text-sm text-white-muted">{customer.email}</p>
            </div>
          </div>
        </div>

        <Tabs
          tabs={[
            {
              value: 'profile',
              label: 'Profile',
              content: (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                    {!editing && (
                      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                        <Edit3 className="h-4 w-4" /> Edit
                      </Button>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-4">
                      <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      <Input label="Email" value={form.email} disabled />
                      <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                      <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                      <div className="flex items-center gap-3 pt-2">
                        <Button loading={saving} onClick={handleSave}>
                          <Save className="h-4 w-4" /> Save
                        </Button>
                        <Button variant="ghost" onClick={() => { setEditing(false); setForm({ name: customer.name, email: customer.email, phone: customer.phone || '', address: customer.address || '', city: customer.city || '' }); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-white-muted" />
                        <span className="text-sm text-white">{customer.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-white-muted" />
                        <span className="text-sm text-white">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-white-muted" />
                          <span className="text-sm text-white">{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-white-muted mt-0.5" />
                          <span className="text-sm text-white">{customer.address}{customer.city ? `, ${customer.city}` : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              value: 'orders',
              label: `Orders (${orders.length})`,
              content: (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center">
                      <Package className="mx-auto h-8 w-8 text-white/20 mb-3" />
                      <p className="text-sm text-white-muted">No orders yet</p>
                      <Link href="/products">
                        <Button variant="outline" size="sm" className="mt-3">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Link key={order.id} href={`/orders/${order.order_number}`}>
                        <div className="glass rounded-2xl p-4 hover:border-accent/30 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-accent">#{order.order_number}</p>
                              <p className="text-xs text-white-muted mt-0.5">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', getOrderStatusColor(order.order_status))}>
                                {getOrderStatusLabel(order.order_status)}
                              </span>
                              <span className="text-sm font-semibold text-white">{formatPrice(order.total)}</span>
                              <ChevronRight className="h-4 w-4 text-white-muted" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
