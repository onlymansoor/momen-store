import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const orderItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1).max(200),
  product_image: z.string().max(500).nullable().optional(),
  price: z.number().positive(),
  quantity: z.number().int().positive().max(100),
});

const orderSchema = z.object({
  customer_name: z.string().min(1).max(100),
  customer_email: z.string().email().max(200),
  customer_phone: z.string().min(1).max(30),
  customer_phone2: z.string().max(30).nullable().optional(),
  shipping_address: z.string().min(1).max(500),
  shipping_city: z.string().min(1).max(100),
  shipping_province: z.string().max(100).nullable().optional(),
  shipping_zip: z.string().max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  payment_method: z.enum(['cod', 'easypaisa']),
  delivery_charges: z.number().min(0).max(100000).optional(),
  payment_proof: z.object({
    image_url: z.string(),
    account_name: z.string(),
    account_number: z.string(),
  }).nullable().optional(),
  items: z.array(orderItemSchema).min(1).max(50),
});

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

async function sendDiscordNotification(order: any, orderItems: any[]) {
  if (!DISCORD_WEBHOOK_URL) return;
  const itemsList = orderItems?.map((i: any) => `${i.product_name} x${i.quantity} = PKR ${(i.price * i.quantity).toLocaleString()}`).join('\n') || 'N/A';
  const embed = {
    title: '🛒 New Order Received',
    color: 0x00ff00,
    fields: [
      { name: 'Order Number', value: order.order_number, inline: true },
      { name: 'Customer', value: order.customer_name, inline: true },
      { name: 'Email', value: order.customer_email, inline: true },
      { name: 'Phone', value: order.customer_phone, inline: true },
      { name: 'Phone 2', value: order.customer_phone2 || 'N/A', inline: true },
      { name: 'Shipping Address', value: `${order.shipping_address}, ${order.shipping_city}${order.shipping_province ? `, ${order.shipping_province}` : ''}${order.shipping_zip ? ` - ${order.shipping_zip}` : ''}`, inline: false },
      { name: 'Payment Method', value: order.payment_method.toUpperCase(), inline: true },
      { name: 'Payment Status', value: order.payment_status.replace(/_/g, ' ').toUpperCase(), inline: true },
      { name: 'Subtotal', value: `PKR ${order.subtotal.toLocaleString()}`, inline: true },
      { name: 'Delivery Charges', value: order.delivery_charges > 0 ? `PKR ${order.delivery_charges.toLocaleString()}` : 'Free', inline: true },
      { name: 'Total', value: `PKR ${order.total.toLocaleString()}`, inline: true },
      ...(order.notes ? [{ name: 'Order Notes', value: order.notes, inline: false }] : []),
      { name: 'Items', value: itemsList },
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

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json({ error: `${firstError.path.join('.')}: ${firstError.message}` }, { status: 400 });
    }

    const { customer_name, customer_email, customer_phone, customer_phone2, shipping_address, shipping_city, shipping_province, shipping_zip, notes, items, payment_method, payment_proof, delivery_charges: clientDelivery } = parsed.data;

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
        notes: notes || null,
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

    // Send notifications
    await sendDiscordNotification(orderData, items);
    await supFetch('POST', 'rpc/insert_notification', {
      notif_type: 'new_order',
      notif_title: `New order #${orderData.order_number}`,
      notif_message: `${orderData.customer_name} placed an order of PKR ${orderData.total.toLocaleString()}`,
      notif_data: { order_id: orderData.id, order_number: orderData.order_number },
    });

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
