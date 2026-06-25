import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };

    const [citiesRes, routesRes, multipliersRes, rulesRes, settingsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/cities?is_active=eq.true&select=id,name&order=sort_order`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/delivery_routes?is_active=eq.true&select=*,from_city:from_city_id(id,name),to_city:to_city_id(id,name)`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/furniture_multipliers?is_active=eq.true&select=category_name,additional_cost`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/quantity_rules?is_active=eq.true&select=min_qty,max_qty,delivery_type,price&order=delivery_type,min_qty`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/delivery_settings?select=key,value`, { headers }),
    ]);

    const cities = await citiesRes.json();
    const routes = await routesRes.json();
    const multipliers = await multipliersRes.json();
    const rules = await rulesRes.json();
    const settings = await settingsRes.json();

    return NextResponse.json({ cities, routes, multipliers, rules, settings });
  } catch (error: any) {
    console.error('Delivery data error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch delivery data' }, { status: 500 });
  }
}
