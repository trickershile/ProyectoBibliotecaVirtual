import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="mx-4 my-8 rounded-3xl border-2 border-[#aa7f5d] bg-gradient-to-br from-[#fff7ee] via-[#efdcc8] to-[#d8bb9e] px-4 py-20 text-center text-[#4b3525] shadow-[0_24px_60px_rgba(95,69,47,0.18)] sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
          Descubre un Mundo de Conocimiento en Línea
        </h1>
        <p className="mb-10 text-xl leading-relaxed text-[#5f4633]">
          Accede a una colección ilimitada de libros, audiolibros y recursos educativos gratuitos. 
          Tu viaje de aprendizaje comienza aquí mismo, sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/register"
            className="rounded-xl border-2 border-[#8f6443] bg-[#8f6443] px-8 py-4 text-center text-lg font-bold text-[#fffaf5] shadow-lg transition hover:bg-[#6f4e36]"
          >
            Comienza Gratis
          </Link>
          <Link 
            to="/catalogo"
            className="rounded-xl border-2 border-[#aa7f5d] bg-[#fffaf4] px-8 py-4 text-center text-lg font-bold text-[#5a3f2b] shadow-lg transition hover:bg-[#ead4bd]"
          >
            Explorar Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
