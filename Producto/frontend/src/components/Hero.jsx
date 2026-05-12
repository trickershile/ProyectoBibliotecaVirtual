import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="bg-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8 text-center rounded-3xl mx-4 my-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
          Descubre un Mundo de Conocimiento en Línea
        </h1>
        <p className="text-xl text-blue-100 mb-10 leading-relaxed">
          Accede a una colección ilimitada de libros, audiolibros y recursos educativos gratuitos. 
          Tu viaje de aprendizaje comienza aquí mismo, sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg text-center"
          >
            Comienza Gratis
          </Link>
          <Link 
            to="/catalogo"
            className="bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg text-center"
          >
            Explorar Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
