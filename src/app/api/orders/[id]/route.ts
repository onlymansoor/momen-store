import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

const VALID_ORDER_STATUSES: OrderStatus[] = ['pending', 'payment_verification_pending', 'accepted', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'verification_pending', 'paid', 'failed', 'refunded'];

const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['payment_verification_pending', 'accepted', 'cancelled'],
  payment_verification_pending: ['accepted', 'cancelled'],
  accepted: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*), payment_proof:payment_proofs(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (order.customer_id && user && order.customer_id !== user.id) {
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!admin) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { order_status, payment_status } = body;

    if (!order_status && !payment_status) {
      return NextResponse.json(
        { error: 'At least one field (order_status or payment_status) is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: order, error: fetchError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {};

    if (order_status) {
      if (!VALID_ORDER_STATUSES.includes(order_status)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        );
      }

      const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[order.order_status as OrderStatus];
      if (!allowedTransitions || !allowedTransitions.includes(order_status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${order.order_status} to ${order_status}` },
          { status: 400 }
        );
      }

      updates.order_status = order_status;

      if (order_status === 'delivered') {
        updates.is_paid = true;
      }

      if (order_status === 'cancelled') {
        updates.order_status = 'cancelled';
      }
    }

    if (payment_status) {
      if (!VALID_PAYMENT_STATUSES.includes(payment_status)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }

      updates.payment_status = payment_status;

      if (payment_status === 'paid') {
        updates.is_paid = true;
      }
    }

    const { error: updateError } = await adminClient
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    await adminClient.from('notifications').insert({
      type: 'order_update',
      title: `Order ${order.order_number} Updated`,
      message: `Order status changed to ${updates.order_status || order.order_status}, payment status changed to ${updates.payment_status || order.payment_status}`,
      data: { order_id: id, order_number: order.order_number },
    });

    return NextResponse.json(
      { message: 'Order updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
