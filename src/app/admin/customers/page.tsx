'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Phone, MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Customer } from '@/lib/types';

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const supabase = createClient();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, count } = await query.range(from, from + PAGE_SIZE - 1).order('created_at', { ascending: false });
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, supabase]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-sm text-white-muted mt-1">{totalCount} customers</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-lg glass pl-10 pr-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers found" description={search ? 'Try a different search' : 'No customers yet'} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Contact</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Orders</th>
                  <th className="text-right py-3 px-4 text-white-muted font-medium">Total Spent</th>
                  <th className="text-left py-3 px-4 text-white-muted font-medium">Joined</th>
                  <th className="text-center py-3 px-4 text-white-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-semibold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{customer.name}</p>
                          <p className="text-xs text-white-muted">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white-muted">{customer.phone || '-'}</td>
                    <td className="py-3 px-4 text-right text-white">-</td>
                    <td className="py-3 px-4 text-right text-white-muted">-</td>
                    <td className="py-3 px-4 text-xs text-white-muted">{formatDate(customer.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={customer.is_active ? 'success' : 'error'}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)} title="Customer Details">
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent text-xl font-bold">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedCustomer.name}</h3>
                <p className="text-sm text-white-muted">{selectedCustomer.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-white-muted text-xs mb-1">
                  <Phone className="h-3 w-3" />
                  <span>Phone</span>
                </div>
                <p className="text-sm text-white">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-white-muted text-xs mb-1">
                  <MapPin className="h-3 w-3" />
                  <span>Location</span>
                </div>
                <p className="text-sm text-white">{selectedCustomer.city || selectedCustomer.province || 'N/A'}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white-muted mb-1">Address</p>
                <p className="text-sm text-white">{selectedCustomer.address}</p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 text-xs text-white-muted">
              Joined {formatDate(selectedCustomer.created_at)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
