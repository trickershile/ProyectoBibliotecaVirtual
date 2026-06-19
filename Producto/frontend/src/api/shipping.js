import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const shippingApi = {
  getLibraryLocations() {
    return apiClient.get(endpoints.shipping.libraryLocations);
  },

  createTracking(payload) {
    return apiClient.post(endpoints.shipping.createTracking, payload);
  },

  getTracking(code) {
    return apiClient.get(endpoints.shipping.tracking(code));
  },

  updateTracking(code, payload) {
    return apiClient.patch(endpoints.shipping.tracking(code), payload);
  },

  getTrackings() {
    return apiClient.get(endpoints.shipping.trackings);
  },

  deleteTracking(code) {
    return apiClient.delete(endpoints.shipping.tracking(code));
  },
};
