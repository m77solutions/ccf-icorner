// components/EventQRCode.tsx
'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CCFEvent } from '@/lib/events';

const SITE_URL = 'https://mango-rock-03cc67610.7.azurestaticapps.net';

type Props = {
  event: CCFEvent;
  size?: number;
};

export default function EventQRCode({ event, size = 140 }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const icsUrl = `${SITE_URL}/events/${event.id}/calendar.ics`;

  useEffect(() => {
    QRCode.toDataURL(icsUrl, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch((err) => console.error('QR generation failed:', err));
  }, [icsUrl, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-gray-100 animate-pulse rounded"
        aria-label="Loading QR code"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={dataUrl}
        alt={`QR code to add ${event.activity} to your calendar`}
        width={size}
        height={size}
        className="rounded border border-gray-200"
      />
      <p className="text-xs text-gray-600 text-center max-w-[160px]">
        📱 Scan to add to your calendar
      </p>
    </div>
  );
}
