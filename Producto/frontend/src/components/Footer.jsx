import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0b0f14] text-[#e7e6f4] py-12 border-t border-[#2a3650]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold text-[#a7d8ff] mb-4 font-mono tracking-tighter uppercase">
              BIBLIOTECA_VIRTUAL<span className="animate-pulse">_</span>
            </h2>
            <p className="text-[#aab3c2] font-sans">
              Tu portal digital para acceder a miles de libros y recursos educativos desde cualquier lugar. 
              Fomentando el conocimiento en la comunidad de Maipú.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#e7e6f4] font-mono uppercase tracking-widest">./enlaces</h3>
            <ul className="space-y-2 font-mono text-sm">
              <li><Link to="/" className="text-[#aab3c2] hover:text-[#a7d8ff] transition">./inicio</Link></li>
              <li><Link to="/catalogo" className="text-[#aab3c2] hover:text-[#a7d8ff] transition">./catalogo</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#e7e6f4] font-mono uppercase tracking-widest">./contacto</h3>
            <p className="text-[#aab3c2] text-sm font-sans">soporte@bibliotecamaipu.cl</p>
            <p className="text-[#aab3c2] text-sm font-sans">+56 2 2123 4567</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#2a3650] text-center text-[#aab3c2] text-[10px] font-mono uppercase tracking-widest">
          &copy; {new Date().getFullYear()} BIBLIOTECA_VIRTUAL_MAIPU. SISTEMA_OPERATIVO_ACTIVO.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
