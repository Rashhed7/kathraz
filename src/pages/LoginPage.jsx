import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('demo') === 'admin') {
      setEmail('admin@kathraz.com');
      setPassword('admin123');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/my-orders');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@kathraz.com');
    setPassword('admin123');
  };

  const fillDemoCustomer = () => {
    setEmail('customer@kathraz.com');
    setPassword('customer123');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <img src="/images/logo.png" alt="Logo" className="h-16 w-auto mx-auto object-contain drop-shadow-lg" />
        <h1 className="font-sans text-2xl font-bold text-ivory">KATHRAZ Client Login</h1>
        <p className="text-xs text-muted font-light">Access your order history and private membership</p>
      </div>

      <div className="bg-card border border-gold/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glass-panel">
        {error && (
          <div className="p-3 bg-red-50 border border-red-400 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Demo Fast Login Bar */}
        <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 space-y-2 text-xs">
          <span className="text-gold font-bold flex items-center gap-1 uppercase tracking-wider text-[11px]">
            Demo Credentials Quick-Fill
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-1.5 px-2 bg-card hover:bg-gold hover:text-charcoal border border-gold/30 rounded text-[11px] font-semibold text-ivory transition-colors text-center"
            >
              ⚡ Demo Admin
            </button>
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="py-1.5 px-2 bg-card hover:bg-gold hover:text-charcoal border border-gold/30 rounded text-[11px] font-semibold text-ivory transition-colors text-center"
            >
              ⚡ Demo Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-muted block mb-1 font-medium">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-obsidian border border-gold/30 text-ivory p-3 pl-9 rounded-lg focus:outline-none focus:border-gold"
              />
              <Mail className="w-4 h-4 text-muted absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-muted block mb-1 font-medium">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-obsidian border border-gold/30 text-ivory p-3 pl-9 rounded-lg focus:outline-none focus:border-gold"
              />
              <Lock className="w-4 h-4 text-muted absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-gold py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-muted border-t border-gold/15 pt-4">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-gold font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
