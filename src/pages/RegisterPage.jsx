import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(name, email, password, phone, address);
      navigate('/my-orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-sans text-2xl font-bold text-ivory">Create account</h1>
        <p className="text-xs text-muted font-light">For faster checkout and order tracking</p>
      </div>

      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glass-panel">
        {error && (
          <div className="p-3 bg-charcoal border border-ivory/40 rounded text-xs text-ivory">
            {error}
          </div>
        )}

        {/* Google sign-in — creates the account on first use */}
        <div>
          <GoogleLoginButton onError={(msg) => setError(msg)} />
        </div>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted">
          <span className="flex-1 h-px bg-ivory/10" />
          or register with email
          <span className="flex-1 h-px bg-ivory/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-muted block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-muted block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-muted block mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-muted block mb-1 font-medium">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-muted block mb-1 font-medium">Default Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-obsidian border border-gold/30 text-ivory p-3 rounded-lg focus:outline-none focus:border-gold h-16"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="text-center text-xs text-muted border-t border-gold/15 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-ivory font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
