import apiClient from './apiClient';
import { endpoints } from './endpoints';

const getCurrentUserId = () => {
  const storedUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
  if (!storedUser?.id) {
    throw new Error('Debes iniciar sesion para usar el carrito del backend.');
  }
  return storedUser.id;
};

export const cartApi = {
  getItems(userId = getCurrentUserId()) {
    return apiClient.get(endpoints.cart.items(userId));
  },

  addItem(item, userId = getCurrentUserId()) {
    return apiClient.post(endpoints.cart.items(userId), {
      libro_id: Number(item.libro_id || item.book_id || item.id),
      cantidad: Number(item.cantidad || item.quantity || 1),
      precio_unitario: Number(item.precio_unitario || item.price || 0),
      tipo_item: item.tipo_item || 'fisico',
    });
  },

  updateItem(itemId, cantidad, userId = getCurrentUserId()) {
    return apiClient.put(endpoints.cart.itemById(userId, itemId), { cantidad: Number(cantidad) });
  },

  removeItem(itemId, userId = getCurrentUserId()) {
    return apiClient.delete(endpoints.cart.itemById(userId, itemId));
  },

  clear(userId = getCurrentUserId()) {
    return apiClient.delete(endpoints.cart.clear(userId));
  },

  checkout(metodo_entrega = 'retiro_biblioteca', userId = getCurrentUserId()) {
    return apiClient.post(endpoints.cart.checkout(userId), { metodo_entrega });
  },
};

export const getCartCount = async () => {
  try {
    const items = await cartApi.getItems();
    return (items || []).reduce((total, item) => total + (item.cantidad || 1), 0);
  } catch (error) {
<<<<<<< HEAD
    if (!String(error?.message || '').toLowerCase().includes('debes iniciar sesion')) {
      console.error('Error al leer el carrito remoto:', error);
    }
=======
    console.error('Error al leer el carrito remoto:', error);
>>>>>>> d92f6350cb9d40ed38561f8ea49b8482c32fc335
    return 0;
  }
};
