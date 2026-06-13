import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const deliveryApi = {
  getSignedUrl(bookId, params = {}) {
    const query = new URLSearchParams();
    if (params.kind) query.append('kind', params.kind);
    if (params.expires_in) query.append('expires_in', String(params.expires_in));
    const serialized = query.toString();
    return apiClient.get(`${endpoints.delivery.signedUrl(bookId)}${serialized ? `?${serialized}` : ''}`);
  },
};
