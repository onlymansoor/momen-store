'use client';

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  onToken: (token: string) => void;
}

export default function Turnstile({ onToken }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    const id = (window as any).turnstile?.render(ref.current, {
      sitekey: siteKey,
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(''),
    });
    widgetId.current = id;

    return () => {
      if (widgetId.current) (window as any).turnstile?.remove(widgetId.current);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <>
      <div ref={ref} />
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </>
  );
}
