import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t-2 border-[#aa7f5d] bg-[#263445] py-12 text-[#f6efe6]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="mb-4 font-mono text-2xl font-bold uppercase tracking-tighter text-[#f3dfca]">
              BIBLIOTECA VIRTUAL
            </h2>
            <p className="font-sans text-[#d7e2ee]">
              Tu portal digital para acceder a miles de libros y recursos educativos desde cualquier lugar. 
              Fomentando el conocimiento en la comunidad de Maipú.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-mono text-lg font-bold uppercase tracking-widest text-[#f3dfca]">Enlaces</h3>
            <ul className="space-y-2 font-mono text-sm">
              <li><Link to="/" className="text-[#d7e2ee] transition hover:text-[#8fc27a]">Inicio</Link></li>
              <li><Link to="/catalogo" className="text-[#d7e2ee] transition hover:text-[#8fc27a]">Catálogo</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-mono text-lg font-bold uppercase tracking-widest text-[#f3dfca]">Contacto</h3>
            <p className="text-sm font-sans text-[#d7e2ee]">soporte@bibliotecamaipu.cl</p>
            <p className="text-sm font-sans text-[#d7e2ee]">+56 2 2123 4567</p>
          </div>
        </div>
        <div className="mt-12 border-t-2 border-[#3a4b5d] pt-8 text-center font-mono text-[10px] uppercase tracking-widest text-[#8fc27a]">
          &copy; {new Date().getFullYear()} Biblioteca Virtual Maipú. Plataforma activa.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
