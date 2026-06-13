import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const notificationsApi = {
  sendContactMessage(payload) {
    return apiClient.post(endpoints.notifications.contact, {
      nombre: payload.nombre,
      email: payload.email,
      telefono: payload.telefono || null,
      asunto: payload.asunto,
      mensaje: payload.mensaje,
    });
  },

  sendInternalNotification(payload, internalToken) {
    return apiClient.post(
      endpoints.notifications.send,
      {
        tipo: payload.tipo || 'generic',
        to_email: payload.to_email || null,
        to_whatsapp: payload.to_whatsapp || null,
        subject: payload.subject,
        body: payload.body,
        metadata: payload.metadata || {},
      },
      {
        headers: internalToken ? { 'X-Internal-Token': internalToken } : {},
      }
    );
  },

  getContactMessages(internalToken) {
    return apiClient.get(endpoints.notifications.contactMessages, {
      headers: internalToken ? { 'X-Internal-Token': internalToken } : {},
    });
  },
};
