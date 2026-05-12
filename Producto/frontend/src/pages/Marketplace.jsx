import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

const Marketplace = () => {
  const addToCart = (book) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.find(item => item.id === book.id)) {
      const updatedCart = [...cart, book];
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      // Notificar al Navbar
      window.dispatchEvent(new Event('storage'));
      alert(`[SISTEMA]: Libro agregado al carrito.`);
    } else {
      alert('[SISTEMA]: El libro ya se encuentra en el carrito.');
    }
  };
  // Mock data with new filter fields
  const mockBooks = [
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      editorial: "Prentice Hall",
      pages: 464,
      image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=300&h=450",
      description: "En un mundo saturado de software deficiente, emerge una guía definitiva. No es solo un libro; es el manifiesto que separa a los programadores de los verdaderos artesanos.",
      is_new: true,
      price: 25000,
      sales_count: 150,
      publication_date: "2008-08-01",
      status: "available",
      delivery_type: "Retiro en biblioteca",
      owner_type: "Biblioteca Municipal de Maipú",
      pickup_location: "Plaza de Maipú",
      category: "Ciencia Ficción",
      mood: "Para leer en un día",
      language: "Español",
      educational_level: "Universitario",
      physical_condition: "Nuevo"
    },
    {
      id: 2,
      title: "Papelucho",
      author: "Marcela Paz",
      editorial: "Editorial Universitaria",
      pages: 120,
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300&h=450",
      description: "Un diario secreto, un niño con una imaginación desbordante y las travesuras que marcaron a toda una generación chilena.",
      is_new: false,
      price: 5000,
      sales_count: 500,
      publication_date: "1947-01-01",
      status: "loaned",
      delivery_type: "Retiro en biblioteca",
      owner_type: "Biblioteca Municipal de Maipú",
      pickup_location: "Ciudad Satélite",
      category: "Fantasía",
      mood: "Para viajar",
      language: "Español",
      educational_level: "Básica",
      physical_condition: "Usado (Excelente estado)"
    },
    {
      id: 3,
      title: "Algebra de Baldor",
      author: "Aurelio Baldor",
      editorial: "Patria",
      pages: 576,
      image: "https://images.unsplash.com/photo-1543004218-ee14110497f9?auto=format&fit=crop&q=80&w=300&h=450",
      description: "El terror de las aulas convertido en la llave maestra del conocimiento universal. Domina el lenguaje de los números.",
      is_new: false,
      price: 15000,
      sales_count: 300,
      publication_date: "2010-01-01",
      status: "available",
      delivery_type: "Retiro en biblioteca",
      owner_type: "Biblioteca Municipal de Maipú",
      pickup_location: "Hospital El Carmen",
      category: "Terror",
      mood: "Libros para llorar",
      language: "Español",
      educational_level: "Media",
      physical_condition: "Usado (Con marcas de uso)"
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    pickup_location: 'all',
    category: 'all',
    mood: 'all',
    language: 'all',
    educational_level: 'all',
    physical_condition: 'all',
    sortBy: 'date'
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      pickup_location: 'all',
      category: 'all',
      mood: 'all',
      language: 'all',
      educational_level: 'all',
      physical_condition: 'all',
      sortBy: 'date'
    });
  };

  // Filter Logic
  const filteredBooks = mockBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || book.status === filters.status;
    const matchesLocation = filters.pickup_location === 'all' || book.pickup_location === filters.pickup_location;
    const matchesCategory = filters.category === 'all' || book.category === filters.category;
    const matchesMood = filters.mood === 'all' || book.mood === filters.mood;
    const matchesLanguage = filters.language === 'all' || book.language === filters.language;
    const matchesEducation = filters.educational_level === 'all' || book.educational_level === filters.educational_level;
    const matchesCondition = filters.physical_condition === 'all' || book.physical_condition === filters.physical_condition;

    return matchesSearch && matchesStatus && matchesLocation && matchesCategory && matchesMood && matchesLanguage && matchesEducation && matchesCondition;
  }).sort((a, b) => {
    if (filters.sortBy === 'date') return new Date(b.publication_date) - new Date(a.publication_date);
    if (filters.sortBy === 'sales') return b.sales_count - a.sales_count;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-blue-500">
            {'>'} CATÁLOGO_BIBLIOTECA
          </h1>
          <p className="text-gray-400 mt-2">Venta oficial de libros de la biblioteca_</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/5 space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-fit sticky top-24">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
              <h2 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                ./CONFIG_FILTROS
              </h2>
              <button 
                onClick={resetFilters}
                className="text-[9px] text-gray-500 hover:text-red-500 transition-colors uppercase font-bold"
              >
                [LIMPIAR]
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">BÚSQUEDA</label>
              <input 
                type="text"
                placeholder="Título/autor..."
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px] focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">ESTADO_PRÉSTAMO</label>
                <select 
                  name="status" 
                  value={filters.status}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todos</option>
                  <option value="available">Disponible</option>
                  <option value="loaned">En préstamo</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">UBICACIÓN_RETIRO</label>
                <select 
                  name="pickup_location" 
                  value={filters.pickup_location}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todas</option>
                  <option value="Plaza de Maipú">Plaza de Maipú</option>
                  <option value="Ciudad Satélite">Ciudad Satélite</option>
                  <option value="El Abrazo">El Abrazo</option>
                  <option value="Hospital El Carmen">Hosp. El Carmen</option>
                </select>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">CATEGORÍA</label>
                <select 
                  name="category" 
                  value={filters.category}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todas</option>
                  <option value="Fantasía">Fantasía</option>
                  <option value="Terror">Terror</option>
                  <option value="Ciencia Ficción">Ciencia Ficción</option>
                  <option value="Novelas">Novelas</option>
                  <option value="Ensayos">Ensayos</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">MOOD / ÁNIMO</label>
                <select 
                  name="mood" 
                  value={filters.mood}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px] text-blue-400 font-bold"
                >
                  <option value="all">Todos los moods</option>
                  <option value="Libros para llorar">Libros para llorar</option>
                  <option value="Para leer en un día">Para leer en un día</option>
                  <option value="Para viajar">Para viajar</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">NIVEL_EDUCATIVO</label>
                <select 
                  name="educational_level" 
                  value={filters.educational_level}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todos</option>
                  <option value="Básica">Básica</option>
                  <option value="Media">Media</option>
                  <option value="Universitario">Universitario</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {/* Physical Condition */}
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">ESTADO_FÍSICO</label>
                <select 
                  name="physical_condition" 
                  value={filters.physical_condition}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todos</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Usado (Excelente estado)">Excelente</option>
                  <option value="Usado (Con marcas de uso)">Con marcas</option>
                </select>
              </div>
            </div>

            {/* Sort */}
            <div className="pt-3 border-t border-gray-800">
              <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">ORDENAR_POR</label>
              <select 
                name="sortBy" 
                value={filters.sortBy}
                onChange={handleFilterChange} 
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px] text-blue-400"
              >
                <option value="date">Fecha</option>
                <option value="sales">Ventas</option>
              </select>
            </div>
          </aside>

          {/* Main Content: Books Grid */}
          <div className="lg:w-4/5 space-y-6">
            {/* Stats Summary */}
            <div className="flex justify-between items-center bg-gray-900/20 p-4 rounded-lg border border-gray-800/50">
              <div className="text-sm">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">TOTAL_RESULTADOS:</span>
                <span className="ml-2 text-blue-400 font-bold">{filteredBooks.length} activos_encontrados</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map((book) => (
                <div 
                  key={book.id} 
                  className="group relative bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col h-full transform hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={book.image} 
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                    
                    {/* Badge */}
                    {book.is_new && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-[8px] font-bold text-white rounded-full uppercase tracking-tighter shadow-lg animate-pulse">
                        NUEVO_INGRESO
                      </div>
                    )}

                    {/* Status Overlay */}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${
                      book.status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {book.status === 'available' ? 'DISPONIBLE' : 'PRESTADO'}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    {/* Title & Author */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 font-mono uppercase tracking-tighter">
                        {book.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-medium italic">por {book.author}</p>
                    </div>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[9px] border-y border-gray-800/50 py-2">
                      <div className="flex flex-col">
                        <span className="text-gray-600 uppercase tracking-tighter">EDITORIAL</span>
                        <span className="text-gray-400 font-bold truncate">{book.editorial}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 uppercase tracking-tighter">GÉNERO</span>
                        <span className="text-blue-500/70 font-bold truncate">{book.category}</span>
                      </div>
                    </div>

                    {/* Sinopsis Atrapante (Compacta) */}
                    <p className="text-[10px] text-gray-400 line-clamp-2 italic mb-4 leading-relaxed flex-grow">
                      "{book.description}"
                    </p>

                    {/* Price & Action */}
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-800/50">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-gray-600 uppercase">PRECIO_VALOR</span>
                        <span className="text-sm font-bold text-white font-mono">
                          ${book.price.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <button 
                      onClick={() => addToCart(book)}
                      disabled={book.status !== 'available'}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        book.status === 'available' 
                        ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                        : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                      }`}
                      title="Agregar al carrito"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    </div>
                  </div>

                  {/* Hover Reveal Info */}
                  <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredBooks.length === 0 && (
              <div className="text-center py-20 bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-800">
                <p className="text-gray-500 font-mono">[!] SIN_RESULTADOS_PARA_LA_BÚSQUEDA</p>
                <button onClick={resetFilters} className="mt-4 text-blue-500 text-xs hover:underline">./reiniciar_filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
