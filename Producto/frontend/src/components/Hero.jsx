import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-[#1a2233] to-[#0f1724] text-[#e7e6f4] py-20 px-4 sm:px-6 lg:px-8 text-center rounded-3xl mx-4 my-8 border border-[#2a3650] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
          Descubre un Mundo de Conocimiento en Línea
        </h1>
        <p className="text-xl text-[#aab3c2] mb-10 leading-relaxed">
          Accede a una colección ilimitada de libros, audiolibros y recursos educativos gratuitos. 
          Tu viaje de aprendizaje comienza aquí mismo, sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/register"
            className="bg-[#1b2a3a] text-[#a7d8ff] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#24354a] transition shadow-lg text-center border border-[#a7d8ff]"
          >
            Comienza Gratis
          </Link>
          <Link 
            to="/catalogo"
            className="bg-[#182a22] text-[#b9fbc0] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#1f3a30] transition shadow-lg text-center border border-[#b9fbc0]"
          >
            Explorar Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
