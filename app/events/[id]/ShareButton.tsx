// app/events/[id]/ShareButton.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  eventUrl: string;
  eventTitle: string;
  eventDate?: string;    // e.g. "Sep 6 · 10:30 AM"
  eventLocation?: string;
};

export default function ShareButton({
  eventUrl,
  eventTitle,
  eventDate,
  eventLocation,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Rich share text used by every channel
  const shareText = [
    `📅 ${eventTitle}`,
    eventDate && `🗓️ ${eventDate}`,
    eventLocation && `📍 ${eventLocation}`,
    '',
    'Register / Join here 👇',
    eventUrl,
  ]
    .filter(Boolean)
    .join('\n');

  const encodedUrl = encodeURIComponent(eventUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(eventTitle);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleShare() {
    // Try native share sheet first (mobile) — this shows Viber, WhatsApp,
    // Messenger, iMessage, and every other installed app in one popup.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: eventTitle,
          text: shareText,
          url: eventUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to popover
        if ((err as Error).name === 'AbortError') return;
      }
    }
    // Desktop / unsupported → show custom popover
    setOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = eventUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const platforms: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    color: string;
  }> = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      color: '#1877F2',
    },
    {
      id: 'messenger',
      label: 'Messenger',
      icon: '💬',
      // fb-messenger:// works on mobile; on desktop, fallback to fb.com/dialog
      href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
      color: '#0084FF',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: '🟢',
      href: `https://wa.me/?text=${encodedText}`,
      color: '#25D366',
    },
    {
      id: 'viber',
      label: 'Viber',
      icon: '🟣',
      href: `viber://forward?text=${encodedText}`,
      color: '#7360F2',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: '✈️',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: '#0088CC',
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: '#000000',
    },
    {
      id: 'email',
      label: 'Email',
      icon: '✉️',
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
      color: '#6B7280',
    },
  ];

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button
        onClick={handleShare}
        style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: '#1FA3C0',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        🔗 Share Event
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Share options"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            padding: '16px',
            zIndex: 50,
            border: '1px solid #E5E7EB',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            Share to
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
            }}
          >
            {platforms.map((p) => (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  textDecoration: 'none',
                  color: '#111827',
                  fontSize: '11px',
                  borderRadius: '8px',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {p.icon}
                </div>
                <span style={{ fontWeight: 500 }}>{p.label}</span>
              </a>
            ))}
            <button
              onClick={copyLink}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#111827',
                fontSize: '11px',
                borderRadius: '8px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: copied ? '#10B981' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white',
                }}
              >
                {copied ? '✓' : '🔗'}
              </div>
              <span style={{ fontWeight: 500 }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
