import { useState } from 'react';
import { booksApi } from '../api/books';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const Vender = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    pickup_location: 'Plaza de Maipú',
    categories: ['General'],
    educational_level: 'General',
    physical_condition: 'Nuevo', // Siempre nuevo
    status: 'available', // Siempre disponible para venta
    is_new: true // Siempre nuevo
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Crear el libro
      const bookData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        publication_date: new Date().toISOString()
      };
      
      const newBook = await booksApi.create(bookData);
      
      // 2. Subir imagen si existe
      if (imageFile && newBook._id) {
        await booksApi.uploadImage(newBook._id, imageFile);
      }

      setSuccess(true);
      setFormData({
        title: '',
        author: '',
        description: '',
        price: '',
        pickup_location: 'Plaza de Maipú',
        categories: ['General'],
        educational_level: 'General',
        physical_condition: 'Nuevo',
        status: 'available',
        is_new: true
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Error al publicar:", err);
      setError("Hubo un error al publicar el libro. Revisa la conexión con el backend.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="bg-gray-900/50 border border-green-500/30 rounded-3xl p-12 space-y-6">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">¡LIBRO PUBLICADO!</h2>
          <p className="text-gray-400 font-mono">Tu libro ha sido indexado correctamente en el sistema de la biblioteca.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
          >
            Publicar otro libro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-mono">
      <h1 className="text-4xl font-bold text-white mb-10 tracking-tighter uppercase border-b border-gray-800 pb-4">
        {'>'} PUBLICAR_LIBRO_NUEVO
      </h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Form Details */}
        <div className="space-y-6 bg-gray-900/30 p-6 rounded-2xl border border-gray-800">
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">TÍTULO_DEL_LIBRO</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text" 
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
              placeholder="Ej: El Quijote de la Mancha"
            />
          </div>

          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">AUTOR_PRINCIPAL</label>
            <input 
              required
              name="author"
              value={formData.author}
              onChange={handleChange}
              type="text" 
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
              placeholder="Ej: Miguel de Cervantes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">PRECIO ($)</label>
              <input 
                required
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number" 
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">CATEGORÍA</label>
              <select 
                name="categories"
                onChange={(e) => setFormData(prev => ({ ...prev, categories: [e.target.value] }))}
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
              >
                <option value="General">General</option>
                <option value="Historia">Historia</option>
                <option value="Educación">Educación</option>
                <option value="Fantasía">Fantasía</option>
                <option value="Terror">Terror</option>
                <option value="Ciencia Ficción">Ciencia Ficción</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">DESCRIPCIÓN_BREVE</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white resize-none"
              placeholder="Describe el estado del libro o de qué trata..."
            />
          </div>
        </div>

        {/* Right Column: Image & Location */}
        <div className="space-y-6">
          {/* Image Upload Area */}
          <div className="relative group">
            <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">PORTADA_DEL_LIBRO</label>
            <div className={`border-2 border-dashed rounded-3xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
              imagePreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700 bg-gray-900/20'
            }`}>
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-600 mb-2" />
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Click para subir imagen</p>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800 space-y-4">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">PUNTO_DE_ENTREGA</label>
              <select 
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
              >
                <option value="Plaza de Maipú">Plaza de Maipú</option>
                <option value="Ciudad Satélite">Ciudad Satélite</option>
                <option value="El Abrazo">El Abrazo</option>
                <option value="Hospital El Carmen">Hosp. El Carmen</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-[10px] font-bold uppercase">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              loading 
              ? 'bg-gray-800 text-gray-500' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_rgba(37,99,235,0.3)] hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'PUBLICAR_LIBRO_EN_SISTEMA'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Vender;
