import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'guest_cart_items';

const readGuestCart = () => {
  const raw = localStorage.getItem(GUEST_CART_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => readGuestCart());
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const isCustomerLoggedIn = isAuthenticated && user?.role === 'Customer';
  const hasMergedGuestCartRef = useRef(false);

  const fetchCart = useCallback(async () => {
    setIsCartLoading(true);
    if (!isCustomerLoggedIn) {
      setItems(readGuestCart());
      setIsCartLoading(false);
      return;
    }

    try {
      const res = await api.get(`/cart/${user.userId}`);
      const normalized = (res.data.data || [])
        .filter((row) => row.Product_ID)
        .map((row) => ({
          Cart_Item_ID: row.Cart_Item_ID,
          Product_ID: row.Product_ID,
          Name: row.Name,
          Price: row.Price,
          Stock: row.Stock,
          Vendor_ID: row.Vendor_ID,
          Image_URL: row.Image_URL,
          quantity: row.Quantity,
        }));

      setItems(normalized);
    } finally {
      setIsCartLoading(false);
    }
  }, [isCustomerLoggedIn, user?.userId]);

  useEffect(() => {
    fetchCart().catch(console.error);
  }, [fetchCart]);

  useEffect(() => {
    const mergeGuestCart = async () => {
      if (!isCustomerLoggedIn || hasMergedGuestCartRef.current) return;

      const guestItems = readGuestCart();
      if (!guestItems.length) {
        hasMergedGuestCartRef.current = true;
        return;
      }

      for (const item of guestItems) {
        await api.post('/cart', {
          productId: item.Product_ID,
          quantity: Number(item.quantity || 1),
        });
      }

      writeGuestCart([]);
      hasMergedGuestCartRef.current = true;
      await fetchCart();
    };

    mergeGuestCart().catch(console.error);
  }, [isCustomerLoggedIn, fetchCart]);

  useEffect(() => {
    if (!isCustomerLoggedIn) {
      hasMergedGuestCartRef.current = false;
    }
  }, [isCustomerLoggedIn]);

  const addItem = async (product) => {
    if (!isCustomerLoggedIn) {
      const guestItems = readGuestCart();
      const existing = guestItems.find((it) => it.Product_ID === product.Product_ID);

      const updated = existing
        ? guestItems.map((it) =>
            it.Product_ID === product.Product_ID ? { ...it, quantity: Number(it.quantity || 0) + 1 } : it
          )
        : [
            ...guestItems,
            {
              Product_ID: product.Product_ID,
              Name: product.Name,
              Price: product.Price,
              Stock: product.Stock,
              Vendor_ID: product.Vendor_ID,
              Category_Name: product.Category_Name,
              Image_URL: product.Image_URL,
              Description: product.Description,
              quantity: 1,
            },
          ];

      writeGuestCart(updated);
      setItems(updated);
      return 'guest';
    }

    await api.post('/cart', {
      productId: product.Product_ID,
      quantity: 1,
    });

    await fetchCart();
    return 'db';
  };

  const updateQty = async (productId, quantity) => {
    const item = items.find((it) => it.Product_ID === productId);
    if (!item) return;

    if (!isCustomerLoggedIn) {
      const updated = items.map((it) =>
        it.Product_ID === productId ? { ...it, quantity: Math.max(1, Number(quantity)) } : it
      );
      writeGuestCart(updated);
      setItems(updated);
      return;
    }

    await api.put(`/cart/${item.Cart_Item_ID}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (productId) => {
    const item = items.find((it) => it.Product_ID === productId);
    if (!item) return;

    if (!isCustomerLoggedIn) {
      const updated = items.filter((it) => it.Product_ID !== productId);
      writeGuestCart(updated);
      setItems(updated);
      return;
    }

    await api.delete(`/cart/${item.Cart_Item_ID}`);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!isCustomerLoggedIn) {
      writeGuestCart([]);
      setItems([]);
      return;
    }

    await Promise.all(items.map((item) => api.delete(`/cart/${item.Cart_Item_ID}`)));
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.Price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clearCart, fetchCart, total, isCartLoading }),
    [items, total, fetchCart, isCartLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};
