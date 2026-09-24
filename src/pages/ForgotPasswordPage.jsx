import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';

const API = {
  forgot: (email) =>
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  reset: (token, password) =>
    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }),
};

export default function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const resetToken = params.get('token');

  return resetToken ? <ResetForm token={resetToken} /> : <RequestForm />;
}

/* ---------- Step 1: request a reset link ---------- */
function RequestForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await API.forgot(email);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <img src="/images/logo.png" alt="Logo" className="h-16 w-auto mx-auto object-contain drop-shadow-lg" />
        <h1 className="font-sans text-2xl font-bold text-ivory">Forgot password</h1>
        <p className="text-xs text-muted font-light">We'll email you a secure reset link</p>
      </div>

      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glass-panel">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gold" />
            </div>
            <p className="text-xs text-ivory leading-relaxed">
              If an account exists for <span className="text-gold font-bold">{email}</span>, a password
              reset link is on its way. Check your inbox — and spam folder — in the next few minutes.
            </p>
            <Link to="/login" className="inline-block text-xs text-gold font-bold hover:underline">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-charcoal border border-ivory/40 rounded text-xs text-ivory">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-muted block mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-3 pl-9 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <div className="text-center text-xs text-muted border-t border-gold/15 pt-4">
              Remembered it?{' '}
              <Link to="/login" className="text-gold font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Step 2: set a new password from the emailed link ---------- */
function ResetForm({ token }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.reset(token, password);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <img src="/images/logo.png" alt="Logo" className="h-16 w-auto mx-auto object-contain drop-shadow-lg" />
        <h1 className="font-sans text-2xl font-bold text-ivory">Choose a new password</h1>
        <p className="text-xs text-muted font-light">Pick something strong and unique</p>
      </div>

      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glass-panel">
        {done ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-gold" />
            </div>
            <p className="text-xs text-ivory">Password updated! Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-charcoal border border-ivory/40 rounded text-xs text-ivory">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-muted block mb-1 font-medium">New password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-3 pl-9 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <KeyRound className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="text-muted block mb-1 font-medium">Confirm new password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-3 pl-9 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <KeyRound className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
