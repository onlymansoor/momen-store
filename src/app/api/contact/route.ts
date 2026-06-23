import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(contact: any) {
  if (!DISCORD_WEBHOOK_URL) return;
  const embed = {
    title: '📧 New Contact Form Submission',
    color: 0x3498db,
    fields: [
      { name: 'Name', value: contact.customer_name, inline: true },
      { name: 'Email', value: contact.customer_email || 'N/A', inline: true },
      { name: 'Subject', value: contact.subject, inline: false },
      { name: 'Message', value: contact.message.substring(0, 1000), inline: false },
      ...(contact.rating ? [{ name: 'Rating', value: `${contact.rating}/5`, inline: true }] : []),
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
    const { customer_name, customer_email, subject, message, rating } = await request.json();
    if (!customer_name || !subject || !message) {
      return NextResponse.json({ error: 'Name, subject, and message are required' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: contact, error } = await supabase
      .from('feedback')
      .insert({
        customer_name,
        customer_email: customer_email || null,
        subject,
        message,
        rating: rating || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed: ${error.message}` }, { status: 500 });
    }

    await sendDiscordNotification(contact);

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
  }
}
