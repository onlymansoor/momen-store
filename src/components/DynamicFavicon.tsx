'use client';

import { useEffect } from 'react';
import { useStoreSettings } from '@/lib/store/settings-store';

export default function DynamicFavicon() {
  const { logo_url, load } = useStoreSettings();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!logo_url) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);

      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) {
        link.href = canvas.toDataURL();
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = canvas.toDataURL();
        document.head.appendChild(newLink);
      }
    };
    img.src = logo_url;
  }, [logo_url]);

  return null;
}
