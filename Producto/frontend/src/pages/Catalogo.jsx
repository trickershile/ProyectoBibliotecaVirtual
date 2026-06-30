import { useState, useEffect, useMemo } from 'react';
import { Book, Search, Loader2, Info, ShoppingCart, Heart } from 'lucide-react';
import { booksApi } from '../api/books';
import { searchApi } from '../api/search';
import { wishlistApi } from '../api/wishlist';
import { withApiOrigin } from '../lib/supabase';
import { addCartItem } from '../lib/cart';
import { statusStyles, theme } from '../lib/theme';

const Catalogo = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    pickup_location: 'all',
    categories: 'all',
    educational_level: 'all',
    sort_by: 'date'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const applyClientFilters = (data = []) =>
    data
      .filter((book) => {
        const matchesPickup =
          !filters.pickup_location ||
          filters.pickup_location === 'all' ||
          book.pickup_location === filters.pickup_location;

        const matchesCategory =
          !filters.categories ||
          filters.categories === 'all' ||
          book.categories?.includes(filters.categories);

        const matchesStatus = book.status === 'available';

        return matchesPickup && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (filters.sort_by === 'rating') {
          return Number(b.rating || 0) - Number(a.rating || 0);
        }

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch.length > 0) {
        const data = await searchApi.searchBooks({
          q: trimmedSearch,
          limit: 50,
          offset: 0,
        });
        setBooks(applyClientFilters(data));
      } else {
        const params = {
          ...filters,
          status: 'available',
        };

        if (params.categories && params.categories !== 'all') {
          params.categories = [params.categories];
        } else {
          delete params.categories;
        }

        const data = await booksApi.getAll(params);
        setBooks(applyClientFilters(data));
      }
      setError(null);
    } catch (err) {
      console.error("Error al cargar el catálogo:", err);
      setError("No se pudo conectar con el servidor de la biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await searchApi.suggest({
        q: trimmedSearch,
        limit: 6,
      });
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error al cargar sugerencias:', err);
      setSuggestions([]);
    }
  };

  const fetchWishlist = async () => {
    let sbUser = null;
    try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
    if (!sbUser) {
      setWishlistIds([]);
      return;
    }

    try {
      setWishlistLoading(true);
      const data = await wishlistApi.getMy();
      const ids = (data || []).map((item) => item.libro_id || item.book?.id).filter(Boolean);
      setWishlistIds(ids);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const addToCart = async (book) => {
    try {
      const result = await addCartItem(book);
      if (result.added && result.updated) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: `"${book.title}" ya estaba en el carrito y se aumentó la cantidad.` } 
        }));
      } else if (result.added) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: `"${book.title}" fue añadido al sistema de compra.` } 
        }));
      } else if (result.reason === 'unauthenticated') {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'Debes iniciar sesión para usar el carrito.' } 
        }));
      } else if (result.reason === 'duplicate') {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'El ejemplar ya se encuentra en el carrito.' } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'No se pudo agregar el ejemplar al carrito.' } 
        }));
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Error al conectar con el carrito.' } 
      }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      pickup_location: 'all',
      categories: 'all',
      educational_level: 'all',
      sort_by: 'date'
    });
  };

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const toggleWishlist = async (book) => {
    let sbUser = null;
    try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
    const bookId = book._id || book.id;
    if (!sbUser) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Debes iniciar sesión para guardar favoritos.' }
      }));
      return;
    }

    if (!bookId || wishlistLoading) {
      return;
    }

    try {
      setWishlistLoading(true);
      if (wishlistSet.has(bookId)) {
        await wishlistApi.removeMy(bookId);
        setWishlistIds((current) => current.filter((id) => id !== bookId));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `"${book.title}" fue eliminado de favoritos.` }
        }));
      } else {
        await wishlistApi.addMy(bookId);
        setWishlistIds((current) => [...current, bookId]);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `"${book.title}" fue guardado en favoritos.` }
        }));
      }
    } catch (err) {
      console.error('Error al actualizar favoritos:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo actualizar favoritos.' }
      }));
    } finally {
      setWishlistLoading(false);
    }
  };

  const BookSkeleton = () => (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-3xl border-2 border-[#d2b08f] bg-[#fffaf4] shadow-[0_18px_44px_rgba(95,69,47,0.12)]">
      <div className="relative h-72 bg-[#ead4bd]"></div>
      <div className="p-5 space-y-4 flex-grow">
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-[#d2b08f]"></div>
          <div className="h-3 w-1/2 rounded bg-[#e7d4bf]"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-y-2 border-[#ead4bd] py-3">
          <div className="space-y-2">
            <div className="h-2 w-1/2 rounded bg-[#e7d4bf]"></div>
            <div className="h-3 w-full rounded bg-[#d2b08f]"></div>
          </div>
          <div className="space-y-2">
            <div className="ml-auto h-2 w-1/2 rounded bg-[#e7d4bf]"></div>
            <div className="h-3 w-full rounded bg-[#d2b08f]"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-[#e7d4bf]"></div>
          <div className="h-3 w-5/6 rounded bg-[#e7d4bf]"></div>
        </div>
        <div className="mt-auto flex items-center justify-between border-t-2 border-[#ead4bd] pt-4">
          <div className="space-y-2">
            <div className="h-2 w-10 rounded bg-[#e7d4bf]"></div>
            <div className="h-5 w-16 rounded bg-[#d2b08f]"></div>
          </div>
          <div className="h-10 w-28 rounded-lg bg-[#d8bb9e]"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={theme.pageShell}>
      <div className={`${theme.pageContainer} space-y-6 sm:space-y-8`}>
        
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 border-b-2 border-[#b9926d] pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="flex items-start gap-2 text-2xl font-bold uppercase tracking-tighter text-[#5a3f2b] sm:items-center sm:gap-3 sm:text-3xl lg:text-4xl">
              <Book className="mt-0.5 h-6 w-6 shrink-0 text-[#8f6443] sm:mt-0 sm:h-8 sm:w-8" /> Catálogo libros nuevos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6f523c] sm:text-base">Venta oficial de ejemplares nuevos de la Biblioteca Municipal de Maipú</p>
          </div>
          <div className={theme.headerBadge}>
            <Info className="h-3 w-3 shrink-0 text-[#8f6443]" />
            Sistema de venta oficial
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* Sidebar Filters */}
          <aside className={`h-fit w-full space-y-4 ${theme.sectionCard} p-4 sm:p-5 xl:sticky xl:top-24 xl:w-72 xl:shrink-0`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#d2b08f] pb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#7f5c40]">
                Filtros búsqueda
              </h2>
              <button 
                onClick={resetFilters}
                className="text-[9px] font-bold uppercase text-[#8a3f34] transition-colors hover:text-[#6f2f27]"
              >
                Resetear
              </button>
            </div>

            {/* Search */}
            <div>
              <label className={theme.label}>Buscar libro</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Título o autor..."
                  list="catalog-search-suggestions"
                  className={`${theme.input} pl-8 pr-3 py-2 text-[11px]`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <datalist id="catalog-search-suggestions">
                  {suggestions.map((suggestion) => (
                    <option key={suggestion.id || suggestion._id} value={suggestion.title}>
                      {suggestion.author}
                    </option>
                  ))}
                </datalist>
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9d7553]" />
              </div>
              {searchTerm.trim().length > 0 && (
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[#7f5c40]">
                  Búsqueda activa
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-3 border-t-2 border-[#d2b08f] pt-3">
              <div>
                <label className={theme.label}>Punto de entrega</label>
                <select 
                  name="pickup_location" 
                  value={filters.pickup_location}
                  onChange={handleFilterChange} 
                  className={`${theme.select} px-3 py-2 text-[11px]`}
                >
                  <option value="all">Todas las sedes</option>
                  <option value="Plaza de Maipú">Sede Central (Plaza)</option>
                  <option value="Ciudad Satélite">Sede Ciudad Satélite</option>
                  <option value="El Abrazo">Sede El Abrazo</option>
                  <option value="Hospital El Carmen">Sede Hosp. El Carmen</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3 border-t-2 border-[#d2b08f] pt-3">
              <div>
                <label className={theme.label}>Área temática</label>
                <select 
                  name="categories" 
                  value={filters.categories}
                  onChange={handleFilterChange} 
                  className={`${theme.select} px-3 py-2 text-[11px]`}
                >
                  <option value="all">Todas las áreas</option>
                  <option value="Historia">Historia</option>
                  <option value="Educación">Educación</option>
                  <option value="Literatura">Literatura</option>
                  <option value="Ciencia">Ciencia</option>
                  <option value="Infantil">Infantil</option>
                </select>
              </div>

              <div>
                <label className={theme.label}>Nivel lector</label>
                <select 
                  name="educational_level" 
                  value={filters.educational_level}
                  onChange={handleFilterChange} 
                  className={`${theme.select} px-3 py-2 text-[11px]`}
                >
                  <option value="all">Todos los niveles</option>
                  <option value="Básica">Básica</option>
                  <option value="Media">Media</option>
                  <option value="Universitario">Universitario</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {/* Sort */}
            <div className="border-t-2 border-[#d2b08f] pt-3">
              <label className={theme.label}>Ordenar por</label>
              <select 
                name="sort_by" 
                value={filters.sort_by}
                onChange={handleFilterChange} 
                className={`${theme.select} px-3 py-2 text-[11px] font-bold`}
              >
                <option value="date">Novedades</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </aside>

          {/* Main Content: Catalog Grid */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Results Header */}
            <div className={`${theme.mutedCard} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
              <div className="text-[11px] font-bold">
                <span className="uppercase tracking-widest text-[#7f5c40]">Stock en sistema:</span>
                <span className="ml-2 break-words text-[#5a3f2b]">{books.length} ejemplares nuevos</span>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-[#8f6443]" />}
            </div>

            {error && (
              <div className="rounded-2xl border-2 border-[#d7a59d] bg-[#f5dfd8] p-12 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-[#8a3f34]">{error}</p>
                <button 
                  onClick={fetchBooks}
                  className="mt-4 rounded-lg border-2 border-[#d7a59d] bg-[#ebc7bd] px-6 py-2 text-[10px] font-bold text-[#8a3f34] transition-all hover:bg-[#ddb0a4]"
                >
                  Reintentar conexión
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {loading ? (
                // Mostrar 6 esqueletos mientras carga
                Array(6).fill(0).map((_, i) => <BookSkeleton key={i} />)
              ) : (
                books.map((book) => (
                  <div 
                    key={book._id || book.id} 
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[#b9926d] bg-[#fffaf4] shadow-[0_18px_44px_rgba(95,69,47,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-[#9d7553]"
                  >
                    {/* Image Container */}
                    <div className="relative h-64 overflow-hidden bg-[#ead4bd] sm:h-72">
                      <img 
                        src={book.image_url ? withApiOrigin(book.image_url) : "https://via.placeholder.com/300x450?text=LIBRO+NUEVO"} 
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#4b3525]/35 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Badge */}
                      <div className="absolute left-3 top-3 rounded-md bg-[#6f8a60] px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#fffaf5] shadow-xl sm:left-4 sm:top-4">
                        Libro nuevo
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(book)}
                        className={`absolute right-3 top-3 rounded-full border p-2 transition-all sm:right-4 sm:top-4 ${
                          wishlistSet.has(book._id || book.id)
                            ? 'border-[#d7a59d] bg-[#f5dfd8] text-[#8a3f34]'
                            : 'border-[#d2b08f] bg-[#fffaf4]/90 text-[#9d7553] hover:border-[#b26b61] hover:text-[#8a3f34]'
                        }`}
                        title={wishlistSet.has(book._id || book.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      >
                        <Heart className={`w-4 h-4 ${wishlistSet.has(book._id || book.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      {/* Header Info */}
                      <div className="mb-3">
                        <h3 className="line-clamp-2 text-sm font-bold uppercase leading-tight tracking-tighter text-[#5a3f2b] transition-colors group-hover:text-[#3f2b1d]">
                          {book.title}
                        </h3>
                        <p className="mt-1 text-[10px] font-medium italic text-[#7f5c40]">Autor: {book.author}</p>
                      </div>

                      {/* Meta Specs */}
                      <div className="mb-4 grid grid-cols-1 gap-3 border-y-2 border-[#ead4bd] py-3 text-[9px] sm:grid-cols-2 sm:gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold uppercase tracking-tighter text-[#9d7553]">Disponible en</span>
                          <span className="break-words font-bold text-[#5a3f2b]">{book.pickup_location}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:text-right">
                          <span className="font-bold uppercase tracking-tighter text-[#9d7553]">Categoría</span>
                          <span className="break-words font-bold text-[#7f5c40]">{(book.categories && book.categories[0]) || 'General'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mb-5 flex-grow line-clamp-3 text-[10px] leading-relaxed text-[#6f523c]">
                        {book.description || "Ejemplar nuevo sellado, disponible para entrega inmediata bajo supervisión de la biblioteca."}
                      </p>

                      {/* Actions */}
                      <div className="mt-auto flex flex-col gap-3 border-t-2 border-[#ead4bd] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-[#9d7553]">Precio de venta</span>
                          <span className="text-lg font-black text-[#5a3f2b]">
                            ${(book.price || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => addToCart(book)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#6f8a60] bg-[#6f8a60] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[#fffaf5] transition-all shadow-[0_12px_24px_rgba(79,95,73,0.18)] hover:bg-[#566b4a] sm:w-auto sm:shrink-0"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          COMPRAR
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {!loading && books.length === 0 && !error && (
              <div className={`${theme.emptyState} sm:py-24`}>
                <Book className="mx-auto mb-4 h-12 w-12 text-[#9d7553]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#7f5c40]">No se encontraron ejemplares en el catálogo.</p>
                <button onClick={resetFilters} className="mt-4 text-[10px] font-bold text-[#5a3f2b] hover:underline">Recargar todos los registros</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
