import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as cartApi from '../api/cart.api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], subtotal: 0, item_count: 0 });
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartApi.getCart();
      setCart(data.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);


  const addItem = async (variant_id, quantity = 1) => {
    const { data } = await cartApi.addToCart({ variant_id, quantity });
    setCart(data.data);
    return data.data;
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await cartApi.updateCartItem(itemId, quantity);
    setCart(data.data);
  };

  const removeItem = async (itemId) => {
    const { data } = await cartApi.removeCartItem(itemId);
    setCart(data.data);
  };

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addItem, updateItem, removeItem, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
