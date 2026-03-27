import { useState } from 'react';
import { Link } from 'react-router-dom';

const Marketplace = () => {
  // Mock data with new filter fields
  const mockBooks = [
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      description: "Un manual de artesanía de software ágil. Esencial para cualquier desarrollador.",
      is_new: true,
      price: 25000,
      rating: 4.8,
      sales_count: 150,
      publication_date: "2008-08-01",
      status: "available", // available, loaned
      delivery_type: "Retiro en biblioteca", // Retiro en biblioteca, Coordinar con vecino
      owner_type: "Municipalidad de Maipú", // Municipalidad de Maipú, Colección Privada
      pickup_location: "Plaza de Maipú",
      category: "Ensayos",
      language: "Español",
      educational_level: "Universitario",
      physical_condition: "Nuevo",
      seller: { id: 101, username: "biblioteca_central" }
    },
    {
      id: 2,
      title: "Papelucho",
      author: "Marcela Paz",
      description: "Clásico de la literatura infantil chilena.",
      is_new: false,
      price: 5000,
      rating: 4.9,
      sales_count: 500,
      publication_date: "1947-01-01",
      status: "loaned",
      delivery_type: "Coordinar con vecino",
      owner_type: "Colección Privada",
      pickup_location: "Ciudad Satélite",
      category: "Literatura Infantil",
      language: "Español",
      educational_level: "Básica",
      physical_condition: "Usado (Excelente estado)",
      seller: { id: 102, username: "vecino_maipu" }
    },
    {
      id: 3,
      title: "Algebra de Baldor",
      author: "Aurelio Baldor",
      description: "Texto escolar esencial para matemáticas.",
      is_new: false,
      price: 15000,
      rating: 4.5,
      sales_count: 300,
      publication_date: "2010-01-01",
      status: "available",
      delivery_type: "Retiro en biblioteca",
      owner_type: "Municipalidad de Maipú",
      pickup_location: "Hospital El Carmen",
      category: "Textos Escolares",
      language: "Español",
      educational_level: "Media",
      physical_condition: "Usado (Con marcas de uso)",
      seller: { id: 103, username: "biblioteca_hospital" }
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    delivery_type: 'all',
    owner_type: 'all',
    pickup_location: 'all',
    category: 'all',
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
      delivery_type: 'all',
      owner_type: 'all',
      pickup_location: 'all',
      category: 'all',
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
    const matchesDelivery = filters.delivery_type === 'all' || book.delivery_type === filters.delivery_type;
    const matchesOwner = filters.owner_type === 'all' || book.owner_type === filters.owner_type;
    const matchesLocation = filters.pickup_location === 'all' || book.pickup_location === filters.pickup_location;
    const matchesCategory = filters.category === 'all' || book.category === filters.category;
    const matchesLanguage = filters.language === 'all' || book.language === filters.language;
    const matchesEducation = filters.educational_level === 'all' || book.educational_level === filters.educational_level;
    const matchesCondition = filters.physical_condition === 'all' || book.physical_condition === filters.physical_condition;

    return matchesSearch && matchesStatus && matchesDelivery && matchesOwner && 
           matchesLocation && matchesCategory && matchesLanguage && matchesEducation && matchesCondition;
  }).sort((a, b) => {
    if (filters.sortBy === 'date') return new Date(b.publication_date) - new Date(a.publication_date);
    if (filters.sortBy === 'sales') return b.sales_count - a.sales_count;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-blue-500">
            {'>'} CATÁLOGO_MARKETPLACE
          </h1>
          <p className="text-gray-400 mt-2">Sistema de intercambio y venta de conocimiento_</p>
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

              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">TIPO_ENTREGA</label>
                <select 
                  name="delivery_type" 
                  value={filters.delivery_type}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todos</option>
                  <option value="Retiro en biblioteca">Retiro biblioteca</option>
                  <option value="Coordinar con vecino">Vecino (C2C)</option>
                </select>
              </div>
            </div>

            {/* Origin */}
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-gray-500 text-[9px] font-bold mb-1 uppercase tracking-widest">PROPIETARIO</label>
                <select 
                  name="owner_type" 
                  value={filters.owner_type}
                  onChange={handleFilterChange} 
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px]"
                >
                  <option value="all">Todos</option>
                  <option value="Municipalidad de Maipú">Municipalidad</option>
                  <option value="Colección Privada">Vecinos</option>
                </select>
              </div>

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
                  <option value="Literatura Infantil">Infantil</option>
                  <option value="Textos Escolares">Escolares</option>
                  <option value="Novelas">Novelas</option>
                  <option value="Ensayos">Ensayos</option>
                  <option value="Ciencia Ficción">Ciencia Ficción</option>
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
                <option value="rating">Valoración</option>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBooks.map((book) => (
                <div key={book.id} className="group relative bg-gray-900/30 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full overflow-hidden">
                  {/* Status Badges */}
                  <div className="flex gap-2 absolute top-4 right-4 z-10">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${book.status === 'available' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {book.status === 'available' ? 'DISPONIBLE' : 'EN PRÉSTAMO'}
                    </div>
                    <div className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase">
                      {book.category}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate pr-24">
                      {book.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{book.author}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-y-3 mb-6 text-[10px]">
                    <div>
                      <span className="text-gray-500 block uppercase">ORIGEN</span>
                      <span className="text-gray-300">{book.owner_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">UBICACIÓN</span>
                      <span className="text-gray-300">{book.pickup_location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">ENTREGA</span>
                      <span className="text-gray-300">{book.delivery_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase">CONDICIÓN</span>
                      <span className="text-gray-300">{book.physical_condition}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-grow italic border-l-2 border-gray-800 pl-4">
                    "{book.description}"
                  </p>

                  {/* Stats & Metadata */}
                  <div className="flex justify-between items-center mb-6 border-y border-gray-800/50 py-3">
                    <div className="flex gap-4 text-[10px]">
                      <div>
                        <span className="text-gray-500 block uppercase">VALORACIÓN</span>
                        <span className="text-blue-400 font-bold">★ {book.rating}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase">IDIOMA</span>
                        <span className="text-gray-300">{book.language}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block uppercase text-[10px]">PRECIO</span>
                      <span className="text-lg font-bold text-white">${book.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Footer Section: Seller & Actions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] uppercase">IDENTIDAD_VENDEDOR</span>
                        <span className="text-sm font-bold text-gray-300">@{book.seller.username}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        to={`/perfil/${book.seller.username}`}
                        className="flex-1 text-center py-2 rounded-lg bg-gray-800 text-gray-400 text-xs font-bold hover:bg-gray-700 transition-all border border-gray-700"
                      >
                        ./ver_perfil
                      </Link>
                      <button 
                        disabled={book.status !== 'available'}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${book.status === 'available' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                      >
                        {book.status === 'available' ? './adquirir_bien' : './en_prestamo'}
                      </button>
                    </div>
                  </div>
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
