import { theme } from '../lib/theme';

const Community = () => {
  return (
    <div className={theme.pageShell}>
      <div className={theme.pageContainer}>
      <div className={theme.pageHeader}>
        <h1 className={theme.pageTitle}>
          Comunidad
        </h1>
        <p className={theme.pageSubtitle}>Ranking de lectores, retos de lectura y debates.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#7f5c40]">Retos de lectura</h2>
            <div className={`${theme.sectionCardCompact} bg-[#eef4e8] border-[#9faf92]`}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-[#5a3f2b]">Reto de abril: "Literatura chilena"</h3>
                <span className="text-xs font-bold text-[#566b4a]">45% completado</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#dce6d4]">
                <div className="h-full w-[45%] bg-[#6f8a60] shadow-[0_0_10px_rgba(111,138,96,0.35)]"></div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#7f5c40]">Top lectores</h2>
            <div className={`${theme.sectionCardCompact} space-y-4 p-4`}>
              {[1, 2, 3].map(rank => (
                <div key={rank} className="flex flex-col gap-2 border-b-2 border-[#ead4bd] p-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#9d7553]">#{rank}</span>
                    <span className="text-sm text-[#5a3f2b]">Lector {rank}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#566b4a]">{1000 - rank * 100} XP</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Community;
