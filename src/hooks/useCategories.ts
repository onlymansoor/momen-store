import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (data) setCategories(data);
      setLoading(false);
    }
    fetch();
  }, []);

  return { categories, loading };
}
