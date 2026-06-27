import { useState } from 'react';
import Button from '../components/Button';
import { notificationsApi } from '../api/notifications';
import { theme } from '../lib/theme';

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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Mensaje enviado correctamente.' } }));
    } catch (error) {
      console.error('Error al enviar contacto:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo enviar el mensaje.' } }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={theme.pageShell}>
      <div className="mx-auto w-full max-w-2xl">
      <div className={theme.centeredHeader}>
        <h1 className={theme.pageTitle}>
          Contacto
        </h1>
        <p className="mt-2 text-[#6f523c]">Formulario para autores, editoriales y colaboraciones.</p>
      </div>
      
      <form onSubmit={handleSubmit} className={`${theme.sectionCard} space-y-6 p-8`}>
        <div>
          <label className={theme.label}>Nombre o entidad</label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={theme.input}
            placeholder="Ej: Editorial Maipú o Juan Pérez"
            required
          />
        </div>
        <div>
          <label className={theme.label}>Correo electrónico</label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={theme.input}
            placeholder="contacto@ejemplo.cl"
            required
          />
        </div>
        <div>
          <label className={theme.label}>Teléfono</label>
          <input 
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className={theme.input}
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div>
          <label className={theme.label}>Asunto</label>
          <select
            name="asunto"
            value={formData.asunto}
            onChange={handleChange}
            className={theme.select}
          >
            <option>Solicitud de Reseña</option>
            <option>Propuesta de Colaboración</option>
            <option>Donación de Activos</option>
            <option>Otros</option>
          </select>
        </div>
        <div>
          <label className={theme.label}>Mensaje</label>
          <textarea 
            rows="5"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            className={theme.textarea}
            placeholder="Escribe tu mensaje aquí..."
            required
          />
        </div>
        <Button type="submit" variant="primary" className="w-full py-3 text-sm shadow-[0_12px_24px_rgba(95,69,47,0.18)]">
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </form>
      </div>
    </div>
  );
};

export default Contact;
