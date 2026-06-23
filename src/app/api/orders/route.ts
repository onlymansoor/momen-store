import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function headers(authToken?: string) {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  };
}

async function supFetch(method: string, path: string, body?: any, authToken?: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: headers(authToken),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

async function sendDiscordNotification(order: any) {
  if (!DISCORD_WEBHOOK_URL) return;
  const embed = {
    title: '🛒 New Order Received',
    color: 0x00ff00,
    fields: [
      { name: 'Order Number', value: order.order_number, inline: true },
      { name: 'Customer', value: order.customer_name, inline: true },
      { name: 'Total', value: `PKR ${order.total.toLocaleString()}`, inline: true },
      { name: 'Payment Method', value: order.payment_method.toUpperCase(), inline: true },
      { name: 'Payment Status', value: order.payment_status.replace(/_/g, ' ').toUpperCase(), inline: true },
      { name: 'Phone', value: order.customer_phone, inline: true },
      { name: 'Items', value: order.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join('\n') || 'N/A' },
    ],
    timestamp: new Date().toISOString(),
  };
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_province, shipping_zip, items, payment_method, payment_proof } = body;

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !shipping_city || !items?.length || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['cod', 'easypaisa'].includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const token = (await supabase.auth.getSession())?.data?.session?.access_token;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const delivery_charges = subtotal >= 2000 ? 0 : 200;
    const total = subtotal + delivery_charges;

    // Generate order number
    const date = new Date();
    const prefix = `MM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = await supFetch('GET', `orders?order_number=ilike.${prefix}%&select=order_number&limit=1`, undefined, token);
    const count = Array.isArray(existing) ? existing.length : 0;
    const order_number = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // Create order
    const order = await supFetch('POST', 'orders', {
      order_number,
      customer_id: user?.id || null,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_province: shipping_province || null,
      shipping_zip: shipping_zip || null,
      subtotal,
      delivery_charges,
      discount: 0,
      total,
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'verification_pending',
      order_status: payment_method === 'cod' ? 'pending' : 'payment_verification_pending',
      is_paid: false,
    }, token);

    const orderData = Array.isArray(order) ? order[0] : order;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_image: item.product_image || null,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    await supFetch('POST', 'order_items', orderItems, token);

    // Decrement stock
    for (const item of items) {
      if (item.product_id) {
        const product = await supFetch('GET', `products?id=eq.${item.product_id}&select=stock_quantity`, undefined, token);
        const prodData = Array.isArray(product) ? product[0] : product;
        if (prodData) {
          await supFetch('PATCH', `products?id=eq.${item.product_id}`, {
            stock_quantity: Math.max(0, (prodData.stock_quantity || 0) - item.quantity),
          }, token);
        }
      }
    }

    // Payment proof
    if (payment_proof && payment_method === 'easypaisa') {
      await supFetch('POST', 'payment_proofs', {
        order_id: orderData.id,
        image_url: payment_proof.image_url,
        account_name: payment_proof.account_name,
        account_number: payment_proof.account_number,
      }, token);
    }

    // Fetch full order
    let fullOrder;
    try {
      fullOrder = await supFetch('GET', `orders?id=eq.${orderData.id}&select=*,items:order_items(*)`, undefined, token);
    } catch {}

    await sendDiscordNotification(fullOrder || orderData);

    return NextResponse.json({ message: 'Order created successfully', order: fullOrder || orderData }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error.message);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = (await supabase.auth.getSession())?.data?.session?.access_token;
    const orders = await supFetch('GET', `orders?customer_id=eq.${user.id}&select=*,items:order_items(*)&order=created_at.desc`, undefined, token);
    return NextResponse.json({ orders: orders || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
