'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: '#F8FAFC',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
        success: {
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#0F172A',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#0F172A',
          },
        },
      }}
    />
  );
}
