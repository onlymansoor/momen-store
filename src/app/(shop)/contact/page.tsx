'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Phone, Mail, Send, Star, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StarRating from '@/components/ui/StarRating';
import toast from 'react-hot-toast';

const STORE_INFO = [
  { icon: MapPin, label: 'Address', value: 'Pakistan' },
  { icon: Phone, label: 'Phone', value: '+92 334 5702532', href: 'tel:+923345702532' },
  { icon: Mail, label: 'Email', value: 'info@Momenstore.com', href: 'mailto:info@Momenstore.com' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+92 334 5702532', href: 'https://wa.me/923345702532' },
  { icon: Clock, label: 'Business Hours', value: 'Mon - Sat: 9:00 AM - 8:00 PM' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          subject: form.subject,
          message: form.message,
          rating: form.rating || null,
        }),
      });

      if (res.ok) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setForm({ name: '', email: '', subject: '', message: '', rating: 0 });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Contact' }]} className="mb-6" />

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Get in Touch</h1>
              <p className="text-sm text-white-muted mb-6">
                Have a question, feedback, or just want to say hi? We&apos;d love to hear from you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={errors.name}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Your Email *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    error={errors.email}
                    placeholder="john@example.com"
                  />
                </div>
                <Input
                  label="Subject *"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  error={errors.subject}
                  placeholder="How can we help?"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white-muted">Your Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here..."
                    rows={5}
                    className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                  {errors.message && <p className="text-xs text-red-400">{errors.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white-muted">Rate Your Experience</label>
                  <StarRating
                    rating={form.rating}
                    interactive
                    onChange={(r) => setForm({ ...form, rating: r })}
                    size={28}
                  />
                </div>
                <Button type="submit" size="lg" loading={loading}>
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Store Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                {STORE_INFO.map((info) => {
                  const Icon = info.icon;
                  const content = (
                    <div key={info.label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-white-muted">{info.label}</p>
                        {info.href ? (
                          <a
                            href={info.href}
                            target={info.href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-sm text-white hover:text-accent transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-sm text-white">{info.value}</p>
                        )}
                      </div>
                    </div>
                  );
                  return content;
                })}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Follow Us</h2>
              <p className="text-sm text-white-muted">
                Stay updated with our latest products and offers on social media.
              </p>
              <a
                href="https://wa.me/923345702532"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
