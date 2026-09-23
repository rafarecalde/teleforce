'use client';

import { useState } from 'react';

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState(initialError ?? '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400) {
        setError(data.error || 'Enter a valid email address.');
        setStatus('idle');
        return;
      }
      // 200 and 429 both return the same neutral message.
      setStatus('sent');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="note ok" role="status">
        If an account matches that email, we&apos;ve sent a sign-in link. Check your inbox — the
        link expires in 15 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary btn-full" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
      {error && (
        <div className="note err" role="alert">
          {error}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        We&apos;ll email a secure, single-use link — no password needed.
      </p>
    </form>
  );
}
