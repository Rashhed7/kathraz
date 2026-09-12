import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        <h1 className="font-sans text-2xl font-bold text-ivory">Join KATHRAZ Membership</h1>
        <p className="text-xs text-muted font-light">Create a private account for order tracking & bespoke sampling</p>
      </div>

      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glass-panel">
        {error && (
          <div className="p-3 bg-red-50 border border-red-400 rounded text-xs text-red-700">
            {error}
          </div>
        )}

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
            {submitting ? 'Creating Account...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-muted border-t border-gold/15 pt-4">
          Already registered?{' '}
          <Link to="/login" className="text-gold font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
