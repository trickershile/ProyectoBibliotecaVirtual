import { booksApi } from '../api/books';
import { cartApi, getCartCount as getRemoteCartCount } from '../api/cart';

const enrichCartItem = async (item = {}) => {
  const bookId = item.libro_id || item.book_id || item.id;
  let book = null;

  if (bookId) {
    try {
      book = await booksApi.getById(bookId);
    } catch (err) {
      console.warn('Error al enriquecer item del carrito:', err);
      book = null;
    }
  }

  return {
    ...item,
    id: item.id || item.cart_item_id,
    cart_item_id: item.id || item.cart_item_id,
    libro_id: bookId,
    quantity: item.quantity || item.cantidad || 1,
    cantidad: item.cantidad || item.quantity || 1,
    price:
      typeof item.price === 'number'
        ? item.price
        : typeof item.precio_unitario === 'number'
          ? item.precio_unitario
          : Number(item.precio_unitario || 0),
    precio_unitario:
      typeof item.precio_unitario === 'number'
        ? item.precio_unitario
        : typeof item.price === 'number'
          ? item.price
          : Number(item.price || 0),
    tipo_item: item.tipo_item || 'fisico',
    title: item.title || book?.title || `Libro #${bookId}`,
    author: item.author || book?.author || 'Autor no disponible',
    image_url: item.image_url || book?.image_url || null,
    categories: item.categories || book?.categories || ['General'],
    pickup_location: item.pickup_location || book?.pickup_location || 'Sin sede',
  };
};

const notifyCartUpdated = () => {
  globalThis.dispatchEvent(new Event('cart-updated'));
  globalThis.dispatchEvent(new Event('storage'));
};

export const getCart = async () => {
  const items = await cartApi.getItems();
  return Promise.all((items || []).map(enrichCartItem));
};

export const addCartItem = async (book) => {
  let storedUser = null;
  // eslint-disable-next-line no-empty
  try { storedUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
  if (!storedUser?.id) {
    return { added: false, reason: 'unauthenticated' };
  }

  const bookId = Number(book?.id || book?._id || book?.libro_id);
  if (!bookId) {
    return { added: false, reason: 'invalid-book' };
  }

  const existingItems = await getCart().catch(() => []);
  const existingItem = existingItems.find((item) => Number(item.libro_id) === bookId && item.tipo_item === 'fisico');

  try {
    const savedItem = await cartApi.addItem({
      libro_id: bookId,
      cantidad: 1,
      precio_unitario: Number(book.price || book.precio_fisico || 0),
      tipo_item: 'fisico',
    });

    notifyCartUpdated();

    return {
      added: true,
      updated: Boolean(existingItem),
      item: await enrichCartItem(savedItem),
    };
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return {
      added: false,
      reason: existingItem ? 'duplicate' : 'unknown',
      error,
    };
  }
};

export const removeCartItem = async (cartItemId) => {
  await cartApi.removeItem(cartItemId);
  notifyCartUpdated();
  return getCart();
};

export const checkoutCart = async (metodoEntrega = 'retiro_biblioteca') => {
  const result = await cartApi.checkout(metodoEntrega);
  notifyCartUpdated();
  return result;
};

export const getCartCount = async () => getRemoteCartCount();
