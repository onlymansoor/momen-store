import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabase = await createServerSupabaseClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, customer:customers(name, avatar_url)')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    return NextResponse.json(
      { ...product, reviews: reviews || [] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
