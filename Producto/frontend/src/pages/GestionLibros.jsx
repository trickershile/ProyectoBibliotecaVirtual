import { useState, useEffect } from 'react';
import { booksApi } from '../api/books';
import { Edit2, Trash2, Plus, Loader2, Search, X, Check, Upload } from 'lucide-react';

const GestionLibros = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: 0,
    description: '',
    pickup_location: 'Plaza de Maipú',
    categories: ['General'],
    status: 'available',
    is_new: true
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getAll();
      setBooks(data);
    } catch (err) {
      console.error("Error al cargar libros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price || 0,
      description: book.description || '',
      pickup_location: book.pickup_location || 'Plaza de Maipú',
      categories: book.categories || ['General'],
      status: book.status || 'available',
      is_new: book.is_new ?? true
    });
    setShowShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ejemplar del inventario?")) {
      try {
        await booksApi.delete(id);
        setBooks(books.filter(b => (b._id || b.id) !== id));
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: "Libro eliminado correctamente_" } }));
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedBook;
      if (editingBook) {
        savedBook = await booksApi.update(editingBook._id || editingBook.id, formData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: "Información actualizada_" } }));
      } else {
        savedBook = await booksApi.create(formData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: "Nuevo libro registrado_" } }));
      }

      if (imageFile && (savedBook._id || savedBook.id)) {
        await booksApi.uploadImage(savedBook._id || savedBook.id, imageFile);
      }

      setShowShowForm(false);
      setEditingBook(null);
      setImageFile(null);
      fetchBooks();
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-blue-500">
              GESTIÓN_DE_INVENTARIO
            </h1>
            <p className="text-gray-500 text-xs mt-1 italic">Administración central de ejemplares nuevos_</p>
          </div>
          <button 
            onClick={() => { setEditingBook(null); setFormData({ title: '', author: '', price: 0, description: '', pickup_location: 'Plaza de Maipú', categories: ['General'], status: 'available', is_new: true }); setShowShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> REGISTRAR_NUEVO_ACTIVO
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex gap-4">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="Filtrar por título o autor..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/20 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4">Portada</th>
                <th className="px-6 py-4">Detalles del Libro</th>
                <th className="px-6 py-4">Ubicación / Sede</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4 text-right">Acciones_</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredBooks.map((book) => (
                <tr key={book._id || book.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-16 bg-black rounded border border-gray-800 overflow-hidden">
                      <img src={book.image_url ? `http://localhost:8000${book.image_url}` : "https://via.placeholder.com/100x150"} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-200 uppercase">{book.title}</p>
                    <p className="text-[10px] text-gray-600 italic">Autor: {book.author}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-bold">{book.pickup_location}</td>
                  <td className="px-6 py-4 font-black text-green-500">${(book.price || 0).toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(book)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(book._id || book.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <h2 className="text-xl font-black uppercase tracking-tighter">{editingBook ? 'EDITAR_ACTIVO' : 'NUEVO_ACTIVO'}</h2>
                <button onClick={() => setShowShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">TÍTULO</label>
                    <input required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">AUTOR</label>
                    <input required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">PRECIO ($)</label>
                    <input type="number" required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">SEDE_RETIRO</label>
                    <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})}>
                      <option value="Plaza de Maipú">Plaza de Maipú</option>
                      <option value="Ciudad Satélite">Ciudad Satélite</option>
                      <option value="El Abrazo">El Abrazo</option>
                      <option value="Hospital El Carmen">Hospital El Carmen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">DESCRIPCIÓN</label>
                    <textarea rows="3" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">PORTADA (OPCIONAL)</label>
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImageFile(e.target.files[0])} />
                      <div className="bg-black border border-gray-800 rounded-xl px-4 py-2 text-[10px] flex items-center gap-2 text-gray-500 italic">
                        <Upload className="w-3 h-3" /> {imageFile ? imageFile.name : 'Click para subir imagen...'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowShowForm(false)} className="px-6 py-2 border border-gray-800 rounded-xl text-[10px] font-bold uppercase hover:bg-white/5 transition-all text-gray-500">CANCELAR</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2">
                    <Check className="w-4 h-4" /> {editingBook ? 'GUARDAR_CAMBIOS' : 'REGISTRAR_ACTIVO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GestionLibros;
