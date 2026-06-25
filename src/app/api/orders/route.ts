import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function headers(authToken?: string) {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

async function supFetch(method: string, path: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${text.slice(0, 500)}`);
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
    const { customer_name, customer_email, customer_phone, customer_phone2, shipping_address, shipping_city, shipping_province, shipping_zip, items, payment_method, payment_proof, delivery_charges: clientDelivery } = body;

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !shipping_city || !items?.length || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['cod', 'easypaisa'].includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const delivery_charges = typeof clientDelivery === 'number' ? clientDelivery : 0;
    const total = subtotal + delivery_charges;

    // Generate unique order number
    const now = new Date();
    const ts = now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const order_number = `MOM${ts}${rand}`;

    // Create order using SECURITY DEFINER RPC (bypasses RLS)
    const order = await supFetch('POST', 'rpc/insert_order', {
      order_data: {
        order_number,
        customer_id: null,
        customer_name,
        customer_email,
        customer_phone,
        customer_phone2: customer_phone2 || null,
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
      },
    });

    const orderData = order;

    // Create order items using SECURITY DEFINER RPC
    await supFetch('POST', 'rpc/insert_order_items', {
      items_data: items.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_image: item.product_image || null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    });

    // Payment proof
    if (payment_proof && payment_method === 'easypaisa') {
      await supFetch('POST', 'payment_proofs', {
        order_id: orderData.id,
        image_url: payment_proof.image_url,
        account_name: payment_proof.account_name,
        account_number: payment_proof.account_number,
      });
    }

    // Send notification
    await sendDiscordNotification(orderData);

    return NextResponse.json({ message: 'Order created successfully', order: orderData }, { status: 201 });
  } catch (error: any) {
    console.error('FATAL:', error?.message || error);
    if (error?.stack) console.error('STACK:', error.stack);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
