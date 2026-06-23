import { NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function POST() {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'DISCORD_WEBHOOK_URL is not configured' },
        { status: 500 }
      );
    }

    const embed = {
      title: '🧪 Test Notification',
      description: 'This is a test notification from Momen Store.',
      color: 0x9b59b6,
      fields: [
        { name: 'Status', value: '✅ Working', inline: true },
        { name: 'Time', value: new Date().toLocaleString('en-PK'), inline: true },
      ],
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Discord webhook responded with ${response.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Test Discord notification sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send Discord notification' },
      { status: 500 }
    );
  }
}
