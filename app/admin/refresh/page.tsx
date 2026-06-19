'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminRefreshPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  async function handleRefresh(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('Triggering refresh...');

    try {
      const res = await fetch('/api/admin-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Refresh triggered!');
        setLastRefresh(new Date().toLocaleString('en-PH', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }));
        setPassword('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Check your connection.');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#C5E4F0',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Link href="/" style={{ marginBottom: 24 }}>
        <img
          src="/welcome-logo.png"
          alt="iCorner"
          style={{ maxWidth: 240, width: '100%', height: 'auto' }}
        />
      </Link>

      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: 24,
          fontWeight: 700,
          color: '#1E3A5F',
          textAlign: 'center'
        }}>
          🔄 Refresh Kiosk
        </h1>
        <p style={{
          margin: '0 0 24px',
          fontSize: 14,
          color: '#64748B',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          Pull latest events from the Google Form.
          <br />
          Updates appear on the kiosk in ~2-3 minutes.
        </p>

        <form onSubmit={handleRefresh}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#1E3A5F',
            marginBottom: 8
          }}>
            Admin Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '2px solid #E2E8F0',
              borderRadius: 8,
              marginBottom: 20,
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={status === 'loading' || !password}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 700,
              color: 'white',
              background: status === 'loading' ? '#94A3B8' : '#2E9DF7',
              border: 'none',
              borderRadius: 8,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {status === 'loading' ? '⏳ Refreshing...' : '🔄 Refresh Kiosk Now'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 8,
            background: status === 'success' ? '#DCFCE7' : status === 'error' ? '#FEE2E2' : '#FEF3C7',
            color: status === 'success' ? '#166534' : status === 'error' ? '#991B1B' : '#92400E',
            fontSize: 14,
            lineHeight: 1.5
          }}>
            {status === 'success' && '✅ '}
            {status === 'error' && '❌ '}
            {status === 'loading' && '⏳ '}
            {message}
          </div>
        )}

        {lastRefresh && (
          <p style={{
            marginTop: 16,
            fontSize: 13,
            color: '#64748B',
            textAlign: 'center'
          }}>
            Last refresh: {lastRefresh}
          </p>
        )}

        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #E2E8F0',
          fontSize: 12,
          color: '#94A3B8',
          textAlign: 'center'
        }}>
          🔒 Admin access only.
          <br />
          Built for Pamilya Z · CCF iCorner
        </div>
      </div>
    </div>
  );
}
