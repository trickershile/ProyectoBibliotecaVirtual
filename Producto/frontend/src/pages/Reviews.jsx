import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, MessageSquare, Send, ShieldCheck, Star, Trash2, XCircle } from 'lucide-react';
import { booksApi } from '../api/books';
import { reviewsApi } from '../api/reviews';
import { withApiOrigin } from '../lib/supabase';

const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-700'}`}
    />
  ));

const Reviews = () => {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [myReviewsByBook, setMyReviewsByBook] = useState({});
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
  const sbProfile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
  const isAdmin = sbProfile?.role === 'admin';

  useEffect(() => {
    fetchBooks();
    if (isAdmin) {
      fetchPendingReviews();
    }
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      fetchReviews(selectedBookId);
    }
  }, [selectedBookId]);

  const selectedBook = useMemo(
    () => books.find((book) => String(book.id || book._id) === String(selectedBookId)) || null,
    [books, selectedBookId]
  );

  const currentReview = useMemo(() => {
    const mappedReview = myReviewsByBook[selectedBookId];
    if (mappedReview) {
      return mappedReview;
    }
    return reviews.find((review) => review.usuario_id === sbUser?.id) || null;
  }, [myReviewsByBook, reviews, selectedBookId, sbUser?.id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true);
      const data = await booksApi.getAll();
      setBooks(data);
      if (data.length > 0) {
        setSelectedBookId(String(data[0].id || data[0]._id));
      }
    } catch (error) {
      console.error('Error al cargar libros para reseñas:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] No se pudo cargar el catálogo para reseñas_' }
      }));
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchReviews = async (bookId) => {
    try {
      setLoadingReviews(true);
      const data = await reviewsApi.getByBook(bookId);
      setReviews(data || []);
      const ownApproved = (data || []).find((review) => review.usuario_id === sbUser?.id);
      if (ownApproved) {
        setMyReviewsByBook((current) => ({ ...current, [bookId]: ownApproved }));
        setReviewForm({
          rating: ownApproved.rating,
          comment: ownApproved.comentario || '',
        });
      } else {
        const existingDraft = myReviewsByBook[bookId];
        setReviewForm({
          rating: existingDraft?.rating || 5,
          comment: existingDraft?.comentario || '',
        });
      }
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const data = await reviewsApi.getPendingModeration();
      setPendingReviews(data || []);
    } catch (error) {
      console.error('Error al cargar moderación pendiente:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!sbUser || !selectedBookId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] Debes iniciar sesión y elegir un libro_' }
      }));
      return;
    }

    try {
      setSubmittingReview(true);
      let response;
      if (currentReview?.id) {
        response = await reviewsApi.update(currentReview.id, reviewForm);
      } else {
        response = await reviewsApi.create(selectedBookId, reviewForm);
      }

      setMyReviewsByBook((current) => ({
        ...current,
        [selectedBookId]: response,
      }));
      setReviewForm({
        rating: response.rating || reviewForm.rating,
        comment: response.comentario || reviewForm.comment,
      });
      if (isAdmin) {
        fetchPendingReviews();
      }
      fetchReviews(selectedBookId);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Reseña enviada. Quedó pendiente de moderación_' }
      }));
    } catch (error) {
      console.error('Error al guardar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] No se pudo guardar la reseña_' }
      }));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsApi.delete(reviewId);
      setMyReviewsByBook((current) => {
        const next = { ...current };
        delete next[selectedBookId];
        return next;
      });
      setReviewForm({ rating: 5, comment: '' });
      await fetchReviews(selectedBookId);
      if (isAdmin) {
        fetchPendingReviews();
      }
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Reseña eliminada correctamente_' }
      }));
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] No se pudo eliminar la reseña_' }
      }));
    }
  };

  const handleModeration = async (reviewId, estado) => {
    try {
      setModerating(true);
      await reviewsApi.moderate(reviewId, estado, estado === 'rejected' ? 'Moderación manual' : null);
      await fetchPendingReviews();
      if (selectedBookId) {
        await fetchReviews(selectedBookId);
      }
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: `Reseña ${estado === 'approved' ? 'aprobada' : 'rechazada'} correctamente_` }
      }));
    } catch (error) {
      console.error('Error al moderar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] No se pudo moderar la reseña_' }
      }));
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase text-purple-500">
          {'>'} ARCHIVO_DE_CRÍTICAS
        </h1>
        <p className="text-gray-400 mt-2">Reseñas reales conectadas al backend con flujo de moderación_</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">SELECCIÓN_LIBRO</p>
                <h2 className="text-xl font-bold text-white mt-1">Explora y evalúa un libro del catálogo</h2>
              </div>
              <div className="min-w-[260px]">
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-purple-500"
                  disabled={loadingBooks || books.length === 0}
                >
                  {loadingBooks ? (
                    <option>Cargando libros...</option>
                  ) : (
                    books.map((book) => (
                      <option key={book.id || book._id} value={book.id || book._id}>
                        {book.title} - {book.author}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedBook && (
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-5 items-center border border-gray-800 rounded-2xl p-4 bg-black/20">
                <div className="w-24 h-32 bg-black/40 rounded-xl overflow-hidden border border-gray-800">
                  {selectedBook.image_url ? (
                    <img src={withApiOrigin(selectedBook.image_url)} alt={selectedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-white font-bold uppercase tracking-tight">{selectedBook.title}</p>
                    <p className="text-[11px] text-gray-500 italic">{selectedBook.author}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase font-bold">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {(selectedBook.categories && selectedBook.categories[0]) || 'General'}
                    </span>
                    <span className="text-gray-400">{reviews.length} reseñas aprobadas</span>
                    <span className="text-yellow-400">Promedio: {averageRating}/5</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {selectedBook.description || 'Este libro aún no tiene descripción extendida en el sistema.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> TU_RESEÑA
              </h2>
              {currentReview && (
                <span className={`text-[9px] font-bold uppercase ${
                  currentReview.estado === 'approved' ? 'text-green-400' : currentReview.estado === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  estado: {currentReview.estado}
                </span>
              )}
            </div>

            {!sbUser ? (
              <p className="text-[11px] text-gray-500 uppercase tracking-widest">Inicia sesión para publicar una reseña_</p>
            ) : !selectedBookId ? (
              <p className="text-[11px] text-gray-500 uppercase tracking-widest">Selecciona un libro para reseñar_</p>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">CALIFICACIÓN</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}
                        className={`p-2 rounded-lg border transition-all ${
                          reviewForm.rating >= value
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300'
                            : 'border-gray-800 bg-black/30 text-gray-600'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${reviewForm.rating >= value ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">COMENTARIO</label>
                  <textarea
                    rows="5"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((current) => ({ ...current, comment: e.target.value }))}
                    className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-purple-500 resize-none"
                    placeholder="Escribe tu evaluación del libro..."
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {currentReview ? 'ACTUALIZAR_RESEÑA' : 'ENVIAR_RESEÑA'}
                  </button>
                  {currentReview?.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(currentReview.id)}
                      className="px-5 py-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      ELIMINAR
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">RESEÑAS_PUBLICADAS</h2>
              {loadingReviews && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>

            {reviews.length === 0 && !loadingReviews ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                <MessageSquare className="w-10 h-10 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Aún no hay reseñas aprobadas para este libro_</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 border-l-4 border-l-purple-500">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                          [RESEÑA #{review.id}]
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase">
                          Usuario: {review.usuario_id === sbUser?.id ? 'TÚ' : review.usuario_id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-gray-500 text-xs">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{review.comentario}</p>
                    <div className="text-[10px] text-gray-500 uppercase">
                      PUBLICADO: {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Sin fecha'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> MÉTRICAS
            </h2>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 uppercase">Libro seleccionado</span>
                <span className="text-white font-bold">{selectedBook ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 uppercase">Promedio</span>
                <span className="text-yellow-400 font-bold">{averageRating}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 uppercase">Aprobadas</span>
                <span className="text-purple-300 font-bold">{reviews.length}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> MODERACIÓN
                </h2>
                <span className="text-[9px] text-gray-500 font-bold">{pendingReviews.length} PENDIENTES</span>
              </div>

              {pendingReviews.length === 0 ? (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">No hay reseñas pendientes_</p>
              ) : (
                <div className="space-y-3">
                  {pendingReviews.slice(0, 8).map((review) => {
                    const reviewBook = books.find((book) => Number(book.id || book._id) === Number(review.libro_id));
                    return (
                      <div key={review.id} className="border border-gray-800 rounded-xl p-4 bg-black/30 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase">
                            {reviewBook?.title || `Libro #${review.libro_id}`}
                          </p>
                          <p className="text-[9px] text-gray-500 uppercase">Usuario: {review.usuario_id.slice(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">{renderStars(review.rating)}</div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{review.comentario}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={moderating}
                            onClick={() => handleModeration(review.id, 'approved')}
                            className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-black uppercase flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={moderating}
                            onClick={() => handleModeration(review.id, 'rejected')}
                            className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-[10px] font-black uppercase flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
