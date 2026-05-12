import Button from '../components/Button';

const Contact = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase text-orange-500">
          {'>'} CANAL_CONTACTO
        </h1>
        <p className="text-gray-400 mt-2">Formulario para autores y colaboraciones_</p>
      </div>
      
      <form className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-6">
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">NOMBRE_AUTOR_O_ENTIDAD</label>
          <input 
            type="text" 
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm"
            placeholder="Ej: Editorial Maipú o Juan Pérez"
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">ASUNTO</label>
          <select className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm">
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
            className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-all text-sm resize-none"
            placeholder="Escribe tu mensaje aquí..."
          ></textarea>
        </div>
        <Button variant="primary" className="w-full bg-orange-600 hover:bg-orange-700 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
          ./enviar_solicitud
        </Button>
      </form>
    </div>
  );
};

export default Contact;
