const Community = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase text-green-500">
          {'>'} NODO_COMUNIDAD
        </h1>
        <p className="text-gray-400 mt-2">Ranking de usuarios, retos de lectura y debates_</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">./RETOS_DE_LECTURA</h2>
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">RETO_ABRIL: "LITERATURA CHILENA"</h3>
                <span className="text-green-500 text-xs font-bold">[45% COMPLETADO]</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[45%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">./TOP_LECTORES</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 space-y-4">
              {[1, 2, 3].map(rank => (
                <div key={rank} className="flex justify-between items-center p-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 font-mono">#{rank}</span>
                    <span className="text-white text-sm">usuario_dev_{rank}</span>
                  </div>
                  <span className="text-green-500 text-[10px] font-bold">{1000 - rank * 100} XP</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Community;
