'use client';

import { create } from 'zustand';

interface StoreSettings {
  logo_url: string;
  store_name: string;
  whatsapp_number: string;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useStoreSettings = create<StoreSettings>((set) => ({
  logo_url: '',
  store_name: 'Momen Store',
  whatsapp_number: '923345702532',
  loaded: false,
  load: async () => {
    if (useStoreSettings.getState().loaded) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('key,value')
        .in('key', ['logo_url', 'store_name', 'whatsapp_number']);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: any) => { map[s.key] = s.value; });
        set({
          logo_url: map.logo_url || '',
          store_name: map.store_name || 'Momen Store',
          whatsapp_number: map.whatsapp_number?.replace(/^\+/, '') || '923345702532',
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
