import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function requireAdmin(request: Request): Promise<Response | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  return null;
}
