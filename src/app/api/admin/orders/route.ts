import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_admin_orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ page_size: pageSize, page_number: page }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin orders error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
