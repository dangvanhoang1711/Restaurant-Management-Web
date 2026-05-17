import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

function makeCartKey(id, toppings) {
  return id + '_' + (toppings || []).map(t => t.id).sort().join('_');
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('quanAnNgon_cart')) || [];
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem('quanAnNgon_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item, qty = 1, toppings = [], note = '') => {
    setCart(prev => {
      const key = makeCartKey(item.id, toppings);
      const exist = prev.find(i => i.key === key);
      if (exist) {
        return prev.map(i =>
          i.key === key ? { ...i, qty: i.qty + qty, note: note || i.note } : i
        );
      }
      return [...prev, {
        key,
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        bg: item.image_bg,
        qty,
        toppings,
        note,
      }];
    });
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQty = useCallback((key, delta) => {
    setCart(prev => prev.map(i =>
      i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((s, i) => {
    const topTotal = (i.toppings || []).reduce((t, tp) => t + tp.price, 0);
    return s + (i.price + topTotal) * i.qty;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
