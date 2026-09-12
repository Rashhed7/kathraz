import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, Globe, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

// Scrolling greetings & offers — edit this list to change the ticker
const ANNOUNCEMENTS = [
  'Welcome to KATHRAZ',
  'Complimentary shipping on orders over ₹5,000',
  'Code KATHRAZ10 — 10% off your first order',
  'WELCOME500 — flat ₹500 off orders above ₹4,000',
  'We deliver across India · Hand-poured in small batches',
];

export default function Navbar({ onOpenSearch }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { totalItemsCount, setIsCartOpen, currency, setCurrency } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-obsidian/95 backdrop-blur-sm border-b border-ivory/10">
      {/* Announcement Bar — scrolling greetings & offers, pauses on hover.
          Black text to match the black logo separators. */}
      <div className="marquee-hover sheen overflow-hidden bg-charcoal text-ivory text-[11px] py-2 tracking-[0.15em] uppercase border-b border-ivory/5">
        <div className="animate-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              {ANNOUNCEMENTS.map((item, idx) => (
                <span key={idx} className="flex items-center whitespace-nowrap">
                  <span className="px-6">{item}</span>
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="h-4 w-auto object-contain animate-sepPulse"
                    style={{ animationDelay: `${(idx % 5) * 0.4}s` }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-ivory hover:text-gold p-2 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <img
            src="/images/logo.png"
            alt="KATHRAZ"
            className="h-7 min-[420px]:h-8 sm:h-10 w-auto object-contain"
          />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-cinzel text-lg sm:text-2xl font-semibold tracking-[0.15em] sm:tracking-[0.3em] text-ivory whitespace-nowrap">
              KATHRAZ
            </span>
            <span className="text-[9px] tracking-[0.4em] text-muted uppercase mt-1 hidden sm:block">
              Fragrances
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8 text-[13px] text-ivory/70">
          <Link to="/" className="hover:text-ivory transition-colors py-2">Home</Link>
          <Link to="/shop" className="hover:text-ivory transition-colors py-2">Shop All</Link>
          <Link to="/shop?category=personal-fragrances" className="hover:text-ivory transition-colors py-2">Extrait de Parfum</Link>
          <Link to="/contact" className="hover:text-ivory transition-colors py-2">Contact</Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1.5 text-muted hover:text-ivory transition-colors py-2">
              <Shield className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-4 shrink-0">
          {/* Currency Switcher */}
          <div className="relative hidden sm:flex items-center text-xs text-muted">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-muted" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs text-ivory border-none focus:ring-0 cursor-pointer pr-1"
            >
              <option value="INR" className="bg-card text-ivory">₹ INR</option>
              <option value="AED" className="bg-card text-ivory">د.إ AED</option>
              <option value="USD" className="bg-card text-ivory">$ USD</option>
            </select>
          </div>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-ivory/70 hover:text-ivory transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist — moved to drawer on phones to avoid crowding the bar */}
          <Link
            to="/shop?wishlist=true"
            className="hidden sm:block p-2 text-ivory/70 hover:text-ivory transition-colors relative"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-ivory text-obsidian text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 text-ivory hover:text-gold transition-colors relative"
            title="Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-ivory text-obsidian text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Account Dropdown — moved to drawer on phones */}
          <div className="hidden sm:block relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 text-ivory/70 hover:text-ivory transition-colors"
            >
              <User className="w-5 h-5" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-ivory/10 shadow-lg py-2 z-50 text-sm">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-ivory/10">
                      <p className="font-medium text-ivory">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/my-orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-ivory/80 hover:bg-charcoal/60 transition-colors"
                    >
                      Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-ivory/80 hover:bg-charcoal/60 transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-muted hover:text-ivory hover:bg-charcoal/60 transition-colors border-t border-ivory/10 mt-1"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-ivory hover:bg-charcoal/60 transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-ivory/80 hover:bg-charcoal/60 transition-colors"
                    >
                      Create Account
                    </Link>
                    <div className="px-4 py-2 border-t border-ivory/10 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/login?demo=admin');
                        }}
                        className="w-full text-xs text-center py-1.5 text-muted hover:text-ivory transition-colors"
                      >
                        Demo admin login
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-obsidian border-b border-ivory/10 px-6 py-6 space-y-1 text-sm animate-fadeIn">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Home</Link>
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Shop All</Link>
          <Link to="/shop?category=personal-fragrances" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Extrait de Parfum</Link>
          <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">FAQ & Support</Link>
          <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Track an Order</Link>
          <Link to="/shop?wishlist=true" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">
            My Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
          </Link>
          <div className="border-t border-ivory/10 my-2" />
          {user ? (
            <>
              <div className="py-1 text-xs text-muted">{user.name}</div>
              <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">My Orders</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Admin</Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                  navigate('/');
                }}
                className="block w-full text-left py-2.5 text-muted hover:text-ivory"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Sign In</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-ivory hover:text-gold">Create Account</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
