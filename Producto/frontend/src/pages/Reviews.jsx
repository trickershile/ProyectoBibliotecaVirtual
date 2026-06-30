import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, MessageSquare, Send, ShieldCheck, Star, Trash2, XCircle } from 'lucide-react';
import { booksApi } from '../api/books';
import { reviewsApi } from '../api/reviews';
import { withApiOrigin } from '../lib/supabase';
import { formatReviewStatus } from '../lib/labels';
import { statusStyles, theme } from '../lib/theme';

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

  let sbUser = null, sbProfile = null;
  try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
  try { sbProfile = JSON.parse(localStorage.getItem('sb_profile')); } catch {}
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
        detail: { message: 'No se pudo cargar el catálogo para reseñas.' }
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
        detail: { message: 'Debes iniciar sesión y elegir un libro.' }
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
        detail: { message: 'Reseña enviada. Quedó pendiente de moderación.' }
      }));
    } catch (error) {
      console.error('Error al guardar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo guardar la reseña.' }
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
        detail: { message: 'Reseña eliminada correctamente.' }
      }));
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo eliminar la reseña.' }
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
        detail: { message: `Reseña ${estado === 'approved' ? 'aprobada' : 'rechazada'} correctamente.` }
      }));
    } catch (error) {
      console.error('Error al moderar reseña:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo moderar la reseña.' }
      }));
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className={theme.pageShell}>
      <div className={theme.pageContainer}>
      <div className={theme.pageHeader}>
        <h1 className={theme.pageTitle}>
          Reseñas de la comunidad
        </h1>
        <p className={theme.pageSubtitle}>Reseñas reales conectadas al backend con flujo de moderación.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className={`${theme.sectionCard} space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Selección de libro</p>
                <h2 className="mt-1 text-xl font-bold text-[#5a3f2b]">Explora y evalúa un libro del catálogo</h2>
              </div>
              <div className="w-full md:max-w-[260px]">
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className={theme.select}
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
              <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border-2 border-[#d2b08f] bg-[#f8ede2] p-4 md:grid-cols-[auto,1fr]">
                <div className="h-32 w-24 overflow-hidden rounded-xl border-2 border-[#d2b08f] bg-[#ead4bd]">
                  {selectedBook.image_url ? (
                    <img src={withApiOrigin(selectedBook.image_url)} alt={selectedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9d7553]">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-bold uppercase tracking-tight text-[#5a3f2b]">{selectedBook.title}</p>
                    <p className="text-[11px] italic text-[#7f5c40]">{selectedBook.author}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase font-bold">
                    <span className={`px-3 py-1 ${theme.statusBadge} ${statusStyles.info}`}>
                      {(selectedBook.categories && selectedBook.categories[0]) || 'General'}
                    </span>
                    <span className="text-[#6f523c]">{reviews.length} reseñas aprobadas</span>
                    <span className="text-[#8a633f]">Promedio: {averageRating}/5</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#6f523c]">
                    {selectedBook.description || 'Este libro aún no tiene descripción extendida en el sistema.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`${theme.sectionCard} space-y-4`}>
            <div className="flex items-center justify-between border-b-2 border-[#d2b08f] pb-3">
              <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">
                <MessageSquare className="w-4 h-4 text-[#8f6443]" /> Tu reseña
              </h2>
              {currentReview && (
                <span className={`text-[9px] font-bold uppercase ${
                  currentReview.estado === 'approved' ? 'text-[#566b4a]' : currentReview.estado === 'rejected' ? 'text-[#8a3f34]' : 'text-[#8a633f]'
                }`}>
                  Estado: {formatReviewStatus(currentReview.estado)}
                </span>
              )}
            </div>

            {!sbUser ? (
              <p className="text-[11px] uppercase tracking-widest text-[#7f5c40]">Inicia sesión para publicar una reseña.</p>
            ) : !selectedBookId ? (
              <p className="text-[11px] uppercase tracking-widest text-[#7f5c40]">Selecciona un libro para reseñar.</p>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-[#7f5c40]">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}
                        className={`p-2 rounded-lg border transition-all ${
                          reviewForm.rating >= value
                            ? 'border-[#d7b988] bg-[#fff4df] text-[#8a633f]'
                            : 'border-[#d2b08f] bg-[#fffaf4] text-[#9d7553]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${reviewForm.rating >= value ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-[#7f5c40]">Comentario</label>
                  <textarea
                    rows="5"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((current) => ({ ...current, comment: e.target.value }))}
                    className={theme.textarea}
                    placeholder="Escribe tu evaluación del libro..."
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={`${theme.primaryButton} flex items-center gap-2 px-5 py-3 text-[10px] disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {currentReview ? 'Actualizar reseña' : 'Enviar reseña'}
                  </button>
                  {currentReview?.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(currentReview.id)}
                      className={`${theme.dangerButton} flex items-center gap-2 px-5 py-3 text-[10px]`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tighter text-[#5a3f2b]">Reseñas publicadas</h2>
              {loadingReviews && <Loader2 className="w-4 h-4 animate-spin text-[#8f6443]" />}
            </div>

            {reviews.length === 0 && !loadingReviews ? (
              <div className={`${theme.emptyState} py-16`}>
                <MessageSquare className="mx-auto mb-4 h-10 w-10 text-[#b9926d]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Aún no hay reseñas aprobadas para este libro.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border-2 border-[#b9926d] border-l-[6px] border-l-[#8f6443] bg-[#fffaf4] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">
                          Reseña #{review.id}
                        </div>
                        <p className="text-[10px] uppercase text-[#9d7553]">
                          Usuario: {review.usuario_id === sbUser?.id ? 'TÚ' : review.usuario_id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-[#7f5c40]">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-[#5a3f2b]">{review.comentario}</p>
                    <div className="text-[10px] uppercase text-[#9d7553]">
                      Publicado: {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Sin fecha'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${theme.sectionCard} space-y-3`}>
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">
              <Star className="w-4 h-4 text-[#b9926d]" /> Métricas
            </h2>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#7f5c40]">Libro seleccionado</span>
                <span className="font-bold text-[#5a3f2b]">{selectedBook ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#7f5c40]">Promedio</span>
                <span className="font-bold text-[#8a633f]">{averageRating}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#7f5c40]">Aprobadas</span>
                <span className="font-bold text-[#5a3f2b]">{reviews.length}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className={`${theme.sectionCard} space-y-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#d2b08f] pb-3">
                <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">
                  <ShieldCheck className="w-4 h-4 text-[#6f8a60]" /> Moderación
                </h2>
                <span className="text-[9px] font-bold text-[#7f5c40]">{pendingReviews.length} pendientes</span>
              </div>

              {pendingReviews.length === 0 ? (
                <p className="text-[10px] uppercase tracking-widest text-[#7f5c40]">No hay reseñas pendientes.</p>
              ) : (
                <div className="space-y-3">
                  {pendingReviews.slice(0, 8).map((review) => {
                    const reviewBook = books.find((book) => Number(book.id || book._id) === Number(review.libro_id));
                    return (
                      <div key={review.id} className="space-y-3 rounded-xl border-2 border-[#d2b08f] bg-[#f8ede2] p-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#5a3f2b]">
                            {reviewBook?.title || `Libro #${review.libro_id}`}
                          </p>
                          <p className="text-[9px] uppercase text-[#9d7553]">Usuario: {review.usuario_id.slice(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">{renderStars(review.rating)}</div>
                        <p className="text-[11px] leading-relaxed text-[#5a3f2b]">{review.comentario}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={moderating}
                            onClick={() => handleModeration(review.id, 'approved')}
                            className={`${theme.successButton} flex flex-1 items-center justify-center gap-2 px-3 py-2 text-[10px]`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={moderating}
                            onClick={() => handleModeration(review.id, 'rejected')}
                            className={`${theme.dangerButton} flex flex-1 items-center justify-center gap-2 px-3 py-2 text-[10px]`}
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
    </div>
  );
};

export default Reviews;
