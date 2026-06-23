import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(feedback: any) {
  if (!DISCORD_WEBHOOK_URL) return;
  const embed = {
    title: '💬 New Feedback Received',
    color: 0xffa500,
    fields: [
      { name: 'Customer', value: feedback.customer_name, inline: true },
      { name: 'Email', value: feedback.customer_email || 'N/A', inline: true },
      { name: 'Subject', value: feedback.subject, inline: false },
      { name: 'Message', value: feedback.message.substring(0, 1000), inline: false },
      ...(feedback.rating ? [{ name: 'Rating', value: `${feedback.rating}/5`, inline: true }] : []),
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
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        customer_name,
        customer_email: customer_email || null,
        subject,
        message,
        rating: rating || null,
        is_read: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Feedback insert failed:', text);
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }

    const feedback = await res.json();
    const feedbackData = Array.isArray(feedback) ? feedback[0] : feedback;
    await sendDiscordNotification(feedbackData);

    return NextResponse.json({ message: 'Feedback submitted successfully', feedback: feedbackData }, { status: 201 });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
