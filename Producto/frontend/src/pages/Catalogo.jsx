import { useState, useEffect } from 'react';
import { Book, Search, Loader2, Info, ShoppingCart } from 'lucide-react';
import { booksApi } from '../api/books';
import { withApiOrigin } from '../lib/supabase';
import { addCartItem } from '../lib/cart';

const Catalogo = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    pickup_location: 'all',
    categories: 'all',
    educational_level: 'all',
    sort_by: 'date'
  });

  useEffect(() => {
    fetchBooks();
  }, [filters, searchTerm]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        status: 'available', // Forzamos solo libros disponibles para venta
        search: searchTerm || undefined
      };
      
      // Ajustar categories para que sea un array si no es 'all'
      if (params.categories && params.categories !== 'all') {
        params.categories = [params.categories];
      } else {
        delete params.categories;
      }

      const data = await booksApi.getAll(params);
      setBooks(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar el catálogo:", err);
      setError("No se pudo conectar con el servidor de la biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (book) => {
    const result = addCartItem(book);
    if (result.added) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: `"${book.title}" añadido al sistema de compra_` } 
      }));
    } else if (result.reason === 'duplicate') {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: `[!] El ejemplar ya se encuentra en el carrito_` } 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: `[!] No se pudo agregar el ejemplar al carrito_` } 
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

  const BookSkeleton = () => (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="relative h-72 bg-gray-800/50"></div>
      <div className="p-5 space-y-4 flex-grow">
        <div className="space-y-2">
          <div className="h-4 bg-gray-800/50 rounded w-3/4"></div>
          <div className="h-3 bg-gray-800/30 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-800/50">
          <div className="space-y-2">
            <div className="h-2 bg-gray-800/30 rounded w-1/2"></div>
            <div className="h-3 bg-gray-800/50 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-800/30 rounded w-1/2 ml-auto"></div>
            <div className="h-3 bg-gray-800/50 rounded w-full"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-800/30 rounded w-full"></div>
          <div className="h-3 bg-gray-800/30 rounded w-5/6"></div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-2 bg-gray-800/30 rounded w-10"></div>
            <div className="h-5 bg-gray-800/50 rounded w-16"></div>
          </div>
          <div className="h-10 bg-gray-800/50 rounded-lg w-28"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase text-blue-500 flex items-center gap-3">
              <Book className="w-8 h-8" /> {'>'} CATÁLOGO_LIBROS_NUEVOS
            </h1>
            <p className="text-gray-400 mt-2">Venta oficial de ejemplares nuevos de la Biblioteca Municipal de Maipú_</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
            <Info className="w-3 h-3 text-blue-400" />
            SISTEMA DE VENTA OFICIAL
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4 space-y-4 bg-gray-900/50 p-5 rounded-2xl border border-gray-800 h-fit sticky top-24">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
              <h2 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                ./FILTROS_BÚSQUEDA
              </h2>
              <button 
                onClick={resetFilters}
                className="text-[9px] text-gray-500 hover:text-red-500 transition-colors uppercase font-bold"
              >
                [RESETEAR]
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">BUSCAR_LIBRO</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Título o autor..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-[11px] focus:border-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">PUNTO_DE_ENTREGA</label>
                <select 
                  name="pickup_location" 
                  value={filters.pickup_location}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-[11px] outline-none"
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
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">ÁREA_TEMÁTICA</label>
                <select 
                  name="categories" 
                  value={filters.categories}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-[11px] outline-none"
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
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">NIVEL_LECTOR</label>
                <select 
                  name="educational_level" 
                  value={filters.educational_level}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-[11px] outline-none"
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
            <div className="pt-3 border-t border-gray-800">
              <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">ORDENAR_POR</label>
              <select 
                name="sort_by" 
                value={filters.sort_by}
                onChange={handleFilterChange} 
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-[11px] text-blue-400 font-bold outline-none"
              >
                <option value="date">Novedades</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </aside>

          {/* Main Content: Catalog Grid */}
          <div className="lg:w-3/4 space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center bg-gray-900/20 p-4 rounded-xl border border-gray-800/50">
              <div className="text-[11px] font-bold">
                <span className="text-gray-500 uppercase tracking-widest">STOCK_EN_SISTEMA:</span>
                <span className="ml-2 text-blue-400">{books.length} EJEMPLARES_NUEVOS</span>
              </div>
              {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>

            {error && (
              <div className="p-12 border border-red-500/30 bg-red-500/5 rounded-2xl text-center">
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest">{error}</p>
                <button 
                  onClick={fetchBooks}
                  className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-[10px] font-bold transition-all"
                >
                  [REINTENTAR_CONEXIÓN_SERVIDOR]
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {loading ? (
                // Mostrar 6 esqueletos mientras carga
                Array(6).fill(0).map((_, i) => <BookSkeleton key={i} />)
              ) : (
                books.map((book) => (
                  <div 
                    key={book._id || book.id} 
                    className="group relative bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1"
                  >
                    {/* Image Container */}
                    <div className="relative h-72 overflow-hidden bg-black/40">
                      <img 
                        src={book.image_url ? withApiOrigin(book.image_url) : "https://via.placeholder.com/300x450?text=LIBRO+NUEVO"} 
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Badge */}
                      <div className="absolute top-4 left-4 px-2.5 py-1 bg-green-600 text-[8px] font-black text-white rounded-md uppercase tracking-widest shadow-xl">
                        LIBRO_NUEVO
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      {/* Header Info */}
                      <div className="mb-3">
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 uppercase tracking-tighter leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium mt-1 italic">Autor: {book.author}</p>
                      </div>

                      {/* Meta Specs */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-[9px] border-y border-gray-800/50 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-600 uppercase font-bold tracking-tighter">DISPONIBLE_EN</span>
                          <span className="text-gray-300 font-bold truncate">{book.pickup_location}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-gray-600 uppercase font-bold tracking-tighter">CATEGORÍA</span>
                          <span className="text-blue-400 font-bold truncate">{(book.categories && book.categories[0]) || 'General'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[10px] text-gray-400 line-clamp-3 mb-5 leading-relaxed flex-grow">
                        {book.description || "Ejemplar nuevo sellado, disponible para entrega inmediata bajo supervisión de la biblioteca."}
                      </p>

                      {/* Actions */}
                      <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">PRECIO_VENTA</span>
                          <span className="text-lg font-black text-white">
                            ${(book.price || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => addToCart(book)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-[9px] transition-all border border-blue-400/50 uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
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
              <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/10">
                <Book className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">No se encontraron ejemplares en el catálogo_</p>
                <button onClick={resetFilters} className="mt-4 text-blue-500 hover:underline text-[10px] font-bold">RECARGAR_TODOS_LOS_REGISTROS</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
