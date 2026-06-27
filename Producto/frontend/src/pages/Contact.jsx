import { useState } from 'react';
import Button from '../components/Button';
import { notificationsApi } from '../api/notifications';

const Contact = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: 'Solicitud de Reseña',
    mensaje: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      await notificationsApi.sendContactMessage(formData);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        asunto: 'Solicitud de Reseña',
        mensaje: '',
      });
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Mensaje enviado correctamente_' } }));
    } catch (error) {
      console.error('Error al enviar contacto:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo enviar el mensaje_' } }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase text-orange-500">
          {'>'} CANAL_CONTACTO
        </h1>
        <p className="text-gray-400 mt-2">Formulario para autores y colaboraciones_</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-6">
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">NOMBRE_AUTOR_O_ENTIDAD</label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm"
            placeholder="Ej: Editorial Maipú o Juan Pérez"
            required
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">CORREO_ELECTRONICO</label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm"
            placeholder="contacto@ejemplo.cl"
            required
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">TELEFONO</label>
          <input 
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm"
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">ASUNTO</label>
          <select
            name="asunto"
            value={formData.asunto}
            onChange={handleChange}
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm"
          >
            <option>Solicitud de Reseña</option>
            <option>Propuesta de Colaboración</option>
            <option>Donación de Activos</option>
            <option>Otros</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">MENSAJE_TRANSCRIPCIÓN</label>
          <textarea 
            rows="5"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm resize-none"
            placeholder="Escribe tu mensaje aquí..."
            required
          />
        </div>
        <Button type="submit" variant="primary" className="w-full bg-orange-600 hover:bg-orange-700 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
          {submitting ? './enviando...' : './enviar_solicitud'}
        </Button>
      </form>
    </div>
  );
};

export default Contact;
