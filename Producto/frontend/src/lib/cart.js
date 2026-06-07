const STORAGE_KEY = 'cart';

const readCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
  return items;
};

export const getCart = () => readCart();

export const getCartCount = () => readCart().length;

export const addCartItem = (item) => {
  const items = readCart();
  const id = item?._id || item?.id;
  if (!id) return writeCart(items);
  const existing = items.find((i) => (i?._id || i?.id) === id);
  if (existing) return writeCart(items);
  return writeCart([...items, item]);
};

export const removeCartItem = (id) => {
  const next = readCart().filter((i) => (i?._id || i?.id) !== id);
  return writeCart(next);
};

export const clearCart = () => writeCart([]);

