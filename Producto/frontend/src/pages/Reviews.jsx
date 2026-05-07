const Reviews = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase text-purple-500">
          {'>'} ARCHIVO_DE_CRÍTICAS
        </h1>
        <p className="text-gray-400 mt-2">Reseñas detalladas con métricas de evaluación_</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 border-l-4 border-l-purple-500">
          <div className="text-xs text-purple-400 mb-2 font-bold uppercase tracking-widest">[SISTEMA_RESEÑA #001]</div>
          <h2 className="text-xl font-bold text-white mb-2">CLEAN CODE: MANUAL DE ARTESANÍA</h2>
          <div className="flex gap-1 mb-4">
            <span className="text-yellow-500 text-lg">★★★★★</span>
            <span className="text-gray-600 text-sm ml-2">9.5/10</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Análisis profundo sobre la mantenibilidad del software. Robert C. Martin establece estándares
            industriales que todo desarrollador debe conocer.
          </p>
          <div className="text-[10px] text-gray-500 uppercase">PUBLICADO: 2026-04-15</div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
