import apiClient from './apiClient';
import { buildQueryString, endpoints } from './endpoints';

const getCurrentUserId = () => {
  const storedUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
  if (!storedUser?.id) {
    throw new Error('Debes iniciar sesión para usar pagos.');
  }
  return storedUser.id;
};

const normalizePayment = (payment = {}) => ({
  ...payment,
  id: payment.id,
  usuario_id: payment.usuario_id,
  orden_id: payment.orden_id,
  monto: typeof payment.monto === 'number' ? payment.monto : Number(payment.monto || 0),
  metodo_pago: payment.metodo_pago || 'transferencia',
  estado: payment.estado || 'pendiente',
});

export const paymentsApi = {
  async createIntent(payload, userId = getCurrentUserId()) {
    const payment = await apiClient.post(endpoints.payments.intents, {
      usuario_id: userId,
      orden_id: String(payload.orden_id),
      monto: Number(payload.monto),
      metodo_pago: payload.metodo_pago,
    });
    return normalizePayment(payment);
  },

  async getMyPayments(userId = getCurrentUserId()) {
    const payments = await apiClient.get(`${endpoints.payments.intents}${buildQueryString({ usuario_id: userId })}`);
    return Array.isArray(payments) ? payments.map(normalizePayment) : [];
  },

  async getAllPayments() {
    const payments = await apiClient.get(endpoints.payments.intents);
    return Array.isArray(payments) ? payments.map(normalizePayment) : [];
  },

  async getById(paymentId) {
    const payment = await apiClient.get(endpoints.payments.intentById(paymentId));
    return normalizePayment(payment);
  },

  async confirm(paymentId) {
    const payment = await apiClient.post(endpoints.payments.confirm(paymentId), {});
    return normalizePayment(payment);
  },

  async refund(paymentId) {
    const payment = await apiClient.post(endpoints.payments.refund(paymentId), {});
    return normalizePayment(payment);
  },

  async delete(paymentId) {
    await apiClient.delete(endpoints.payments.intentById(paymentId));
    return true;
  },
};
