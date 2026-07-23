'use client';

import { useEffect } from 'react';
import { useStoreSettings } from '@/lib/store/settings-store';

export default function DynamicFavicon() {
  const { logo_url, load } = useStoreSettings();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!logo_url) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = logo_url;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = logo_url;
      document.head.appendChild(newLink);
    }
  }, [logo_url]);

  return null;
}
