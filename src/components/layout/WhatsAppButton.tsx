'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '923345702532';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppButton() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full glass p-3 hover:bg-green-500/20 hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
    >
      <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex"
      >
        <MessageCircle className="h-6 w-6 text-green-400" fill="currentColor" />
      </motion.span>
      <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100 whitespace-nowrap text-sm text-white">
        Chat on WhatsApp
      </span>
    </motion.a>
  );
}
