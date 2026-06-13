import apiClient from './apiClient';
import { buildQueryString, endpoints } from './endpoints';

const normalizeBook = (book = {}) => ({
  ...book,
  _id: book._id || book.id,
  id: book.id || book._id,
  title: book.title || book.titulo || '',
  author: book.author || book.autor || '',
  description: book.description || book.sinopsis || '',
  image_url:
    book.image_url ||
    book.url_digital_preview ||
    book.url_libro_completo ||
    book.imagenes?.[0] ||
    null,
  pickup_location: book.pickup_location || book.ubicacion_bodega || 'Plaza de Maipu',
  categories: book.categories || (book.categoria ? [book.categoria] : ['General']),
  category_id: book.category_id || book.categoria_id || null,
  price:
    typeof book.price === 'number'
      ? book.price
      : typeof book.precio_fisico === 'number'
        ? book.precio_fisico
        : 0,
  price_physical:
    typeof book.price_physical === 'number'
      ? book.price_physical
      : typeof book.precio_fisico === 'number'
        ? book.precio_fisico
        : 0,
  price_digital:
    typeof book.price_digital === 'number'
      ? book.price_digital
      : typeof book.precio_digital === 'number'
        ? book.precio_digital
        : 0,
  stock: typeof book.stock === 'number' ? book.stock : book.stock_fisico ?? 0,
  status: book.status || ((book.stock_fisico ?? 0) > 0 ? 'available' : 'unavailable'),
  educational_level: book.educational_level || 'general',
  is_new: book.is_new ?? true,
  rating: book.rating ?? book.calificacion_promedio ?? 0,
});

const filterBooks = (books, params = {}) =>
  books.filter((book) => {
    const matchesSearch =
      !params.search ||
      `${book.title} ${book.author} ${book.description}`.toLowerCase().includes(String(params.search).toLowerCase());

    const matchesPickup =
      !params.pickup_location ||
      params.pickup_location === 'all' ||
      book.pickup_location === params.pickup_location;

    const requestedCategories = Array.isArray(params.categories)
      ? params.categories
      : params.categories && params.categories !== 'all'
        ? [params.categories]
        : [];

    const matchesCategory =
      requestedCategories.length === 0 ||
      requestedCategories.some((category) => book.categories?.includes(category));

    const matchesStatus = !params.status || params.status === 'all' || book.status === params.status;

    return matchesSearch && matchesPickup && matchesCategory && matchesStatus;
  });

const getCategories = async () => {
  const categories = await apiClient.get(endpoints.catalog.categories);
  return Array.isArray(categories) ? categories : [];
};

const resolveCategoryId = async (categories = []) => {
  const availableCategories = await getCategories();
  if (availableCategories.length === 0) {
    throw new Error('El backend no tiene categorias configuradas para crear o editar libros.');
  }

  const requestedName = categories[0];
  const foundCategory = availableCategories.find((category) => category.nombre === requestedName);
  return foundCategory?.id || availableCategories[0].id;
};

const toBackendBookPayload = async (bookData = {}, currentBook = null) => {
  const categoryId = await resolveCategoryId(bookData.categories || currentBook?.categories || []);
  const nowYear = new Date().getFullYear();

  return {
    isbn: bookData.isbn || currentBook?.isbn || `TEMP-${Date.now()}`,
    titulo: bookData.title || currentBook?.title || '',
    autor: bookData.author || currentBook?.author || '',
    editorial: bookData.editorial || currentBook?.editorial || 'Sin editorial',
    anio_publicacion: Number(bookData.anio_publicacion || currentBook?.anio_publicacion || nowYear),
    idioma: bookData.idioma || currentBook?.idioma || 'es',
    num_paginas: Number(bookData.num_paginas || currentBook?.num_paginas || 1),
    categoria_id: categoryId,
    sinopsis: bookData.description || currentBook?.description || '',
    precio_fisico: Number(bookData.price ?? currentBook?.price_physical ?? currentBook?.price ?? 0),
    precio_digital: Number(bookData.price_digital ?? currentBook?.price_digital ?? bookData.price ?? currentBook?.price ?? 0),
    imagenes: currentBook?.imagenes || [],
    calificacion_promedio: Number(currentBook?.rating ?? currentBook?.calificacion_promedio ?? 0),
    stock_fisico: Number(bookData.stock ?? currentBook?.stock ?? 1),
    peso_gramos: Number(bookData.peso_gramos || currentBook?.peso_gramos || 100),
    dimensiones: bookData.dimensiones || currentBook?.dimensiones || 'No especificado',
    ubicacion_bodega: bookData.pickup_location || currentBook?.pickup_location || 'Plaza de Maipu',
    disponible_prestamo: bookData.status ? bookData.status === 'available' : currentBook?.status !== 'unavailable',
    url_digital_preview: currentBook?.url_digital_preview || null,
    url_libro_completo: currentBook?.url_libro_completo || null,
    es_audiolibro: Boolean(bookData.es_audiolibro ?? currentBook?.es_audiolibro ?? false),
    duracion_minutos: bookData.duracion_minutos ?? currentBook?.duracion_minutos ?? null,
  };
};

export const booksApi = {
  async getAll(params = {}) {
    const books = await apiClient.get(`${endpoints.catalog.books}${buildQueryString()}`);
    const normalized = (Array.isArray(books) ? books : []).map(normalizeBook);
    return filterBooks(normalized, params);
  },

  async getById(id) {
    const book = await apiClient.get(endpoints.catalog.bookById(id));
    return normalizeBook(book);
  },

  async create(bookData) {
    const payload = await toBackendBookPayload(bookData);
    const book = await apiClient.post(endpoints.catalog.books, payload);
    return normalizeBook(book);
  },

  async uploadImage(bookId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload(endpoints.catalog.bookImage(bookId), formData);
  },

  async addComment(bookId, comment) {
    return apiClient.post(endpoints.reviews.byBook(bookId), {
      rating: comment.rating,
      comentario: comment.comentario || comment.comment || '',
    });
  },

  async update(id, bookData) {
    const currentBook = await this.getById(id);
    const payload = await toBackendBookPayload(bookData, currentBook);
    const book = await apiClient.patch(endpoints.catalog.bookById(id), payload);
    return normalizeBook(book);
  },

  delete(id) {
    return apiClient.delete(endpoints.catalog.bookById(id));
  },

  getCategories,
};
