'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Mail,
  Star,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime, truncate } from '@/lib/utils';
import type { Feedback } from '@/lib/types';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadFeedback(); }, [filter]);

  async function loadFeedback() {
    setLoading(true);
    try {
      let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (filter === 'read') query = query.eq('is_read', true);
      else if (filter === 'unread') query = query.eq('is_read', false);
      const { data } = await query;
      setFeedback(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase.from('feedback').update({ is_read: true }).eq('id', id);
    if (error) toast.error(error.message);
    else loadFeedback();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase.from('feedback').delete().eq('id', deleteId);
      toast.success('Feedback deleted');
      setDeleteId(null);
      loadFeedback();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
    const item = feedback.find(f => f.id === id);
    if (item && !item.is_read) markAsRead(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-sm text-white-muted mt-1">{feedback.filter(f => !f.is_read).length} unread</p>
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Messages' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' },
          ]}
          value={filter}
          onValueChange={setFilter}
          className="w-40"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size={36} /></div>
      ) : feedback.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No feedback yet" description="Customer feedback will appear here" />
      ) : (
        <div className="space-y-3">
          {feedback.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card
                className={`p-4 cursor-pointer transition-all ${!msg.is_read ? 'border-accent/20 bg-accent/[0.02]' : ''}`}
                onClick={() => toggleExpand(msg.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {!msg.is_read && <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent" />}
                      <h3 className={`text-sm font-medium ${!msg.is_read ? 'text-white' : 'text-white-muted'}`}>
                        {msg.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white-muted">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {msg.customer_name}
                      </span>
                      {msg.customer_email && <span>{msg.customer_email}</span>}
                      <span>{formatDateTime(msg.created_at)}</span>
                      {msg.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          {msg.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(msg.id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedId === msg.id ? (
                      <ChevronUp className="h-4 w-4 text-white-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white-muted" />
                    )}
                  </div>
                </div>

                {expandedId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    {!msg.is_read && (
                      <Button size="sm" variant="ghost" className="mt-3" onClick={(e) => { e.stopPropagation(); markAsRead(msg.id); }}>
                        Mark as Read
                      </Button>
                    )}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Feedback" description="Are you sure you want to delete this feedback message?" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
