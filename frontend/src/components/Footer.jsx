const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Biblioteca Virtual</h2>
            <p className="text-gray-400">
              Tu portal digital para acceder a miles de libros y recursos educativos desde cualquier lugar.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Enlaces</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Inicio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Libros</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contacto</h3>
            <p className="text-gray-400">info@bibliotecavirtual.com</p>
            <p className="text-gray-400">+1 234 567 890</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Biblioteca Virtual. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
