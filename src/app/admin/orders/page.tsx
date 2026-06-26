'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Search, Trash2, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatPrice, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const PAGE_SIZE = 15;

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_verification_pending', label: 'Verification Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      let filtered = data.orders || [];
      if (statusFilter !== 'all') {
        filtered = filtered.filter((o: any) => o.order_status === statusFilter);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((o: any) =>
          o.order_number?.toLowerCase().includes(s) ||
          o.customer_name?.toLowerCase().includes(s)
        );
      }
      setOrders(filtered);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  async function deleteOrder(id: string) {
    setDeleting(true);
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      toast.success('Order deleted');
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function deleteSelected() {
    setDeleting(true);
    const ids = Array.from(selectedOrders);
    try {
      const { error } = await supabase.from('orders').delete().in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} orders deleted`);
      setSelectedOrders(new Set());
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(false);
    setDeleteAllOpen(false);
  }

  async function deleteAllOrders() {
    setDeleting(true);
    try {
      const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast.success('All orders deleted');
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(false);
    setDeleteAllOpen(false);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const tabContent = (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No orders found" description={search || statusFilter !== 'all' ? 'Try different filters' : 'No orders yet'} />
      ) : (
        <>
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white-muted">{selectedOrders.size} selected</span>
              <Button size="sm" variant="danger" onClick={() => setDeleteSelectedOpen(true)} loading={deleting}>
                <Trash2 className="h-4 w-4" /> Delete Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedOrders(new Set())}>
                Clear
              </Button>
            </div>
          )}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 w-10">
                      <input type="checkbox" checked={selectedOrders.size === orders.length && orders.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent" />
                    </th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Order #</th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Customer</th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Items</th>
                    <th className="text-right py-3 px-4 text-white-muted font-medium">Total</th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Payment</th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-white-muted font-medium">Date</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent" />
                      </td>
                      <td className="py-3 px-4 text-white font-medium cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>#{order.order_number}</td>
                      <td className="py-3 px-4 cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                        <div>
                          <p className="text-white">{order.customer_name}</p>
                          <p className="text-xs text-white-muted">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white-muted">{order.items?.length || '-'}</td>
                      <td className="py-3 px-4 text-right text-accent font-medium">{formatPrice(order.total)}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-white-muted capitalize">{order.payment_method}</span>
                      </td>
                      <td className="py-3 px-4 cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                        <Badge className={getOrderStatusColor(order.order_status)}>
                          {getOrderStatusLabel(order.order_status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-white-muted cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>{formatDateTime(order.created_at)}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setDeleteTarget(order.id)} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete order">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );

  const tabs = statusTabs.map(t => ({
    ...t,
    content: tabContent,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-white-muted mt-1">{totalCount} orders total</p>
        </div>
        {orders.length > 0 && (
          <Button size="sm" variant="danger" onClick={() => setDeleteAllOpen(true)} loading={deleting}>
            <AlertTriangle className="h-4 w-4" /> Delete All
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full max-w-md rounded-lg glass pl-10 pr-3 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </Card>

      <Tabs
        tabs={tabs}
        value={statusFilter}
        onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Order"
        description="Are you sure? This cannot be undone."
        onConfirm={() => deleteOrder(deleteTarget!)}
      />

      <ConfirmDialog
        open={deleteSelectedOpen}
        onOpenChange={() => setDeleteSelectedOpen(false)}
        title="Delete Selected Orders"
        description={`Delete ${selectedOrders.size} selected orders permanently?`}
        onConfirm={deleteSelected}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={() => setDeleteAllOpen(false)}
        title="Delete All Orders"
        description="This will permanently delete ALL orders. This cannot be undone."
        onConfirm={deleteAllOrders}
      />
    </div>
  );
}
