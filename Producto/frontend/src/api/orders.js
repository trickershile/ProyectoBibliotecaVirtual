import apiClient from './apiClient';
import { endpoints } from './endpoints';

const getCurrentUserId = () => {
  const storedUser = localStorage.getItem('sb_user');
  if (!storedUser) {
    throw new Error('Debes iniciar sesion para operar con pedidos.');
  }

  const user = JSON.parse(storedUser);
  if (!user?.id) {
    throw new Error('No se pudo identificar el usuario autenticado.');
  }

  return user.id;
};

const normalizeOrderItem = (item = {}, book = null) => ({
  ...item,
  libro_id: item.libro_id,
  tipo_item: item.tipo_item || 'fisico',
  title: item.title || book?.title || `Libro #${item.libro_id}`,
  price: item.price || item.precio_unitario || 0,
  pickup_location: item.pickup_location || book?.pickup_location || 'Sin sede',
  quantity: item.quantity || item.cantidad || 1,
  image_url: item.image_url || book?.image_url || null,
});

const normalizeOrder = (order = {}, items = []) => ({
  ...order,
  _id: order._id || order.id || order.orden_id,
  id: order.id || order._id || order.orden_id,
  status: order.status || order.estado_pago || 'pendiente',
  total_amount: order.total_amount || order.total || order.total_pagado || 0,
  created_at: order.created_at || new Date().toISOString(),
  receipt_url: order.receipt_url || null,
  despacho: order.despacho || null,
  items,
});

const loadBookSummary = async (bookId) => {
  try {
    const book = await apiClient.get(endpoints.catalog.bookById(bookId));
    return {
      title: book.titulo || book.title || `Libro #${bookId}`,
      pickup_location: book.ubicacion_bodega || book.pickup_location || 'Sin sede',
      image_url: book.image_url || book.imagenes?.[0] || book.url_digital_preview || null,
    };
  } catch {
    return null;
  }
};

export const ordersApi = {
  async create(orderData) {
    const userId = getCurrentUserId();
    const payload = {
      usuario_id: userId,
      metodo_entrega: orderData.metodo_entrega || 'retiro_biblioteca',
      items: (orderData.items || []).map((item) => ({
        libro_id: String(item.book_id || item.libro_id || item.id),
        cantidad: Number(item.quantity || item.cantidad || 1),
        precio_unitario: Number(item.price || item.precio_unitario || 0),
        tipo_item: item.tipo_item || 'fisico',
      })),
    };

    const response = await apiClient.post(endpoints.orders.checkout, payload);
    return normalizeOrder(response, orderData.items || []);
  },

  async getById(orderId) {
    const response = await apiClient.get(endpoints.orders.byId(orderId));
    const rawItems = response?.items || [];

    const books = await Promise.all(rawItems.map((item) => loadBookSummary(item.libro_id)));
    const items = rawItems.map((item, index) => normalizeOrderItem(item, books[index]));

    return normalizeOrder({
      ...(response?.orden || {}),
      despacho: response?.despacho || null,
    }, items);
  },

  async getMy() {
    const userId = getCurrentUserId();
    const orders = await apiClient.get(endpoints.orders.byUser(userId));
    const normalizedOrders = await Promise.all((orders || []).map((order) => this.getById(order.id || order._id)));
    return normalizedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getByUser(userId) {
    const orders = await apiClient.get(endpoints.orders.byUser(userId));
    return Promise.all((orders || []).map((order) => this.getById(order.id || order._id)));
  },

  async getAll() {
    const orders = await apiClient.get(endpoints.orders.all);
    const normalizedOrders = await Promise.all((orders || []).map((order) => this.getById(order.id || order._id)));
    return normalizedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  updateStatus(orderId, estado) {
    return apiClient.patch(endpoints.orders.status(orderId), { estado });
  },

  cancel(orderId) {
    return apiClient.patch(endpoints.orders.cancel(orderId), {});
  },

  refund(orderId) {
    return apiClient.post(endpoints.orders.refund(orderId), {});
  },
};
