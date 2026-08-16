'use client';

import { useState } from 'react';

interface ShareButtonProps {
  eventUrl: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  eventTime?: string;
  activityDetail?: string;
  originator?: string;
  cost?: number | string | null;
  regLink?: string;
  otherInfo?: string;
  shareIntro?: string;
  shareHashtags?: string;
}

function buildShareCaption(props: ShareButtonProps): string {
  const {
    eventUrl,
    eventTitle,
    eventDate,
    eventLocation,
    eventTime,
    activityDetail,
    originator,
    cost,
    regLink,
    otherInfo,
    shareIntro,
    shareHashtags,
  } = props;

  const lines: string[] = [];

  // 1. Optional custom intro paragraph
  if (shareIntro && shareIntro.trim()) {
    lines.push(shareIntro.trim());
    lines.push(''); // blank line
  }

  // 2. Title + category
  lines.push(`📌 ${eventTitle}`);
  const subtitle = [activityDetail, originator].filter(Boolean).join(' · ');
  if (subtitle) lines.push(subtitle);
  lines.push('');

  // 3. Date + time
  const dateTimeParts: string[] = [];
  if (eventDate) dateTimeParts.push(eventDate);
  if (eventTime) dateTimeParts.push(eventTime);
  if (dateTimeParts.length) lines.push(`📅 ${dateTimeParts.join(' | ')}`);

  // 4. Location
  if (eventLocation) lines.push(`📍 ${eventLocation}`);

  // 5. Cost — always show, "FREE" for 0
  const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;
  if (cost === 0 || cost === '0' || cost === '' || cost === undefined || cost === null) {
    lines.push('🎁 FREE');
  } else if (typeof cost === 'string' && isNaN(costNum as number)) {
    // Preserve text like "P17,000 PER COUPLE"
    lines.push(`💰 ${cost}`);
  } else if (costNum && costNum > 0) {
    lines.push(`💰 ₱${costNum.toLocaleString()}`);
  }

  // 6. Registration link
  if (regLink && regLink.trim()) {
    const link = regLink.startsWith('http') ? regLink : `https://${regLink}`;
    lines.push(`🎟️ Register: ${link}`);
  }

  // 7. Other info (capped at 200 chars)
  if (otherInfo && otherInfo.trim()) {
    let info = otherInfo.trim();
    if (info.length > 200) info = info.slice(0, 197) + '...';
    lines.push('');
    lines.push(info);
  }

  // 8. Event URL CTA
  lines.push('');
  lines.push(`👉 ${eventUrl}`);

  // 9. Hashtags
  if (shareHashtags && shareHashtags.trim()) {
    lines.push('');
    lines.push(shareHashtags.trim());
  }

  return lines.join('\n');
}

function buildShortCaption(eventTitle: string, eventUrl: string, hashtags?: string): string {
  const base = `${eventTitle} — ${eventUrl}`;
  if (hashtags && (base.length + hashtags.length + 1) < 275) {
    return `${base} ${hashtags.trim()}`;
  }
  return base;
}

export default function ShareButton(props: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const captionFull = buildShareCaption(props);
  const captionShort = buildShortCaption(props.eventTitle, props.eventUrl, props.shareHashtags);
  const encodedFull = encodeURIComponent(captionFull);
  const encodedShort = encodeURIComponent(captionShort);
  const encodedUrl = encodeURIComponent(props.eventUrl);
  const encodedTitle = encodeURIComponent(props.eventTitle);

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: props.eventTitle,
          text: captionFull,
          url: props.eventUrl,
        });
        return;
      } catch (err) {
        // user cancelled or share failed — fall through to popover
      }
    }
    setOpen(!open);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(captionFull);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const shareTargets = [
    {
      label: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      url: `https://wa.me/?text=${encodedFull}`,
    },
    {
      label: 'Viber',
      icon: '💜',
      color: '#7360F2',
      url: `viber://forward?text=${encodedFull}`,
    },
    {
      label: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedFull}`,
    },
    {
      label: 'Messenger',
      icon: '💌',
      color: '#0084FF',
      url: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
    },
    {
      label: 'Facebook',
      icon: '👍',
      color: '#1877F2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    },
    {
      label: 'X / Twitter',
      icon: '🐦',
      color: '#000000',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(captionShort)}`,
    },
    {
      label: 'Email',
      icon: '✉️',
      color: '#6B7280',
      url: `mailto:?subject=${encodedTitle}&body=${encodedFull}`,
    },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleNativeShare}
        style={{
          background: '#0F172A',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        📤 Share Event
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 998,
            }}
          />
          {/* popover */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              padding: 16,
              zIndex: 999,
              minWidth: 280,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 12,
                color: '#0F172A',
              }}
            >
              Share this event
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {shareTargets.map((t) => (
                <a
                  key={t.label}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  title={t.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: '#1F2937',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: t.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    {t.icon}
                  </span>
                  {t.label}
                </a>
              ))}
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                background: copied ? '#10B981' : '#F3F4F6',
                color: copied ? 'white' : '#1F2937',
                border: 'none',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {copied ? '✓ Copied caption!' : '📋 Copy caption'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
