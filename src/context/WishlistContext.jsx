import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [token]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist.map(w => w.id));
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!token) {
      // Local toggle for guest
      setWishlist(prev => 
        prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      );
      return;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      const data = await res.json();
      if (data.added) {
        setWishlist(prev => [...prev, productId]);
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
      }
    } catch (e) {
      console.error('Toggle wishlist failed', e);
    }
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, wishlistCount: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
