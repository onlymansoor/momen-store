import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { error: deleteError } = await adminClient
      .from('cart_items')
      .delete()
      .eq('customer_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to sync cart' },
        { status: 500 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { message: 'Cart synced successfully', items: [] },
        { status: 200 }
      );
    }

    const cartItems = items.map((item: any) => ({
      customer_id: user.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const { data: savedItems, error } = await adminClient
      .from('cart_items')
      .insert(cartItems)
      .select('*, product:products(*)');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to sync cart' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Cart synced successfully', items: savedItems },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
