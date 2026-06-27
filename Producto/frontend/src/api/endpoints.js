export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    verify: '/auth/verify',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  catalog: {
    books: '/catalog/books',
    bookById: (bookId) => `/catalog/books/${bookId}`,
    bookImage: (bookId) => `/catalog/books/${bookId}/image`,
    bookAction: (bookId) => `/catalog/books/${bookId}/action`,
    categories: '/catalog/categories',
    categoryById: (categoryId) => `/catalog/categories/${categoryId}`,
  },
  wishlist: {
    mine: '/wishlist/me',
    byUser: (userId) => `/wishlist/${userId}`,
    addMine: (bookId) => `/wishlist/me/add/${bookId}`,
    addByUser: (userId, bookId) => `/wishlist/${userId}/add/${bookId}`,
    removeMine: (bookId) => `/wishlist/me/remove/${bookId}`,
    removeByUser: (userId, bookId) => `/wishlist/${userId}/remove/${bookId}`,
  },
  orders: {
    checkout: '/orders/checkout',
    byId: (orderId) => `/orders/${orderId}`,
    byUser: (userId) => `/orders/user/${userId}`,
    all: '/orders',
    status: (orderId) => `/orders/${orderId}/status`,
    cancel: (orderId) => `/orders/${orderId}/cancel`,
    refund: (orderId) => `/orders/${orderId}/refund`,
  },
  cart: {
    items: (userId) => `/cart/${userId}/items`,
    itemById: (userId, itemId) => `/cart/${userId}/items/${itemId}`,
    clear: (userId) => `/cart/${userId}/clear`,
    checkout: (userId) => `/cart/${userId}/checkout`,
  },
  reviews: {
    health: '/reviews/health',
    byBook: (bookId) => `/reviews/books/${bookId}`,
    byId: (reviewId) => `/reviews/${reviewId}`,
    moderationPending: '/reviews/moderation/pending',
    moderate: (reviewId) => `/reviews/${reviewId}/moderate`,
  },
  notifications: {
    contact: '/notifications/contact',
    send: '/notifications/send',
    contactMessages: '/notifications/contact-messages',
  },
  search: {
    books: '/search/books',
    suggest: '/search/suggest',
  },
  shipping: {
    libraryLocations: '/shipping/libraries-locations',
    trackings: '/shipping/trackings',
    tracking: (code) => `/shipping/tracking/${code}`,
    createTracking: '/shipping/tracking',
  },
  payments: {
    intents: '/payments/intents',
    intentById: (paymentId) => `/payments/intents/${paymentId}`,
    confirm: (paymentId) => `/payments/intents/${paymentId}/confirm`,
    refund: (paymentId) => `/payments/intents/${paymentId}/refund`,
  },
  delivery: {
    signedUrl: (bookId) => `/delivery/books/${bookId}/signed-url`,
  },
  ia: {
    websocket: (userId) => `/ia/chat/${userId}`,
  },
};

export const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '' && item !== 'all') {
          query.append(key, item);
        }
      });
      return;
    }

    query.append(key, value);
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};
