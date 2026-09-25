import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SearchModal from './components/SearchModal';
import ContactButtons from './components/ContactButtons';
import Preloader from './components/Preloader';
import ScrollToTop from './components/ScrollToTop';

// Page transition: fades each route in on navigation. Keyed by pathname so
// React remounts the wrapper per route, replaying the animation.
function PageTransition({ children }) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="animate-pageIn">
      {children}
    </div>
  );
}

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrderPage from './pages/TrackOrderPage';
import InvoicePage from './pages/InvoicePage';
import MyOrdersPage from './pages/MyOrdersPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Router>
      {/* Must live INSIDE <Router> (it uses useLocation). Resets the scroll
          position to the top on every route change. */}
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen bg-obsidian text-ivory flex flex-col justify-between selection:bg-gold selection:text-white">
              <Preloader />
              <Navbar onOpenSearch={() => setIsSearchOpen(true)} />

              <main className="flex-1">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home onOpenSearch={() => setIsSearchOpen(true)} />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/track-order" element={<TrackOrderPage />} />
                    <Route path="/invoice-all" element={<InvoicePage />} />
                    <Route path="/invoice/:orderNumber" element={<InvoicePage />} />
                    <Route path="/my-orders" element={<MyOrdersPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ForgotPasswordPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Routes>
                </PageTransition>
              </main>

              <Footer />
              <ContactButtons />
              <CartDrawer />
              <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            </div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
