'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  User,
  ShieldAlert,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import type { Admin, AdminRole } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const supabase = createClient();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' as AdminRole });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentAdminId(user.id);
    });
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    try {
      const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
      setAdmins(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingAdmin(null);
    setForm({ name: '', email: '', password: '', role: 'admin' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(admin: Admin) {
    setEditingAdmin(admin);
    setForm({ name: admin.name, email: admin.email, password: '', role: admin.role });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!editingAdmin && !form.password) errs.password = 'Password is required';
    else if (form.password && form.password.length < 6) errs.password = 'Min 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingAdmin) {
        const { error: updateError } = await supabase
          .from('admins')
          .update({ name: form.name.trim(), email: form.email.trim(), role: form.role })
          .eq('id', editingAdmin.id);
        if (updateError) throw updateError;

        if (form.password) {
          toast('Profile updated. Password changes must be done via the "Forgot password" flow.', { icon: 'ℹ️' });
        }
        toast.success('Admin updated');
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { name: form.name.trim(), role: form.role } },
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          const { error: insertError } = await supabase.from('admins').insert({
            id: authData.user.id,
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            password_hash: '',
            is_active: true,
          });
          if (insertError) throw insertError;
        }
        toast.success('Admin created');
      }

      setModalOpen(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase.from('admins').delete().eq('id', deleteId);
      toast.success('Admin deleted');
      setDeleteId(null);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const superAdminCount = admins.filter(a => a.role === 'super_admin').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admins</h1>
          <p className="text-sm text-white-muted mt-1">{admins.length} administrators</p>
        </div>
        <Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
          Add Admin
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : admins.length === 0 ? (
        <EmptyState icon={<Shield className="h-8 w-8" />} title="No admins yet" description="Add administrators to manage the store" action={{ label: 'Add Admin', onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent text-lg font-semibold">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{admin.name}</h3>
                      <p className="text-xs text-white-muted mt-0.5">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {admin.role === 'super_admin' ? (
                          <Badge variant="gold" className="flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="info">Admin</Badge>
                        )}
                        <Badge variant={admin.is_active ? 'success' : 'error'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white-muted">Joined {formatDateTime(admin.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(admin)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (admin.id === currentAdminId) {
                          toast.error('You cannot delete yourself');
                          return;
                        }
                        if (admin.role === 'super_admin' && superAdminCount <= 1) {
                          toast.error('Cannot delete the last super admin');
                          return;
                        }
                        setDeleteId(admin.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} />
          <Input label="Email" type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} />
          <Input
            label={editingAdmin ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
            error={errors.password}
          />
          <Select
            label="Role"
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' },
            ]}
            value={form.role}
            onValueChange={v => setForm(p => ({ ...p, role: v as AdminRole }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingAdmin ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Admin"
        description="Are you sure you want to remove this admin? They will lose all access."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
