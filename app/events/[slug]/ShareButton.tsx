'use client';

import { useState } from 'react';

export function NativeShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch (err) {
        // User cancelled or error — fall through to copy
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: '#1FA3C0', color: 'white',
        padding: '14px 16px', borderRadius: 12,
        border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: 14, width: '100%',
      }}
    >
      {copied ? '✅ Link Copied!' : '📤 Share Event'}
    </button>
  );
}
