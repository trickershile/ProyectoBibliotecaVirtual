import Hero from '../components/Hero';
import Card from '../components/Card';
import Button from '../components/Button';
import Carousel from '../components/Carousel';
import TerminalCard from '../components/TerminalCard';

const Home = () => {
  const mockBooks = [
    {
      title: "Cien años de soledad",
      author: "Gabriel García Márquez",
      category: "Literatura Clásica",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=500&auto=format&fit=crop",
      description: "Una de las novelas más famosas de la literatura universal, que narra la historia de la familia Buendía a lo largo de siete generaciones."
    },
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Tecnología",
      imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=500&auto=format&fit=crop",
      description: "Una guía esencial para desarrolladores de software para escribir código legible, mantenible y profesional."
    },
    {
      title: "El principito",
      author: "Antoine de Saint-Exupéry",
      category: "Infantil / Filosofía",
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=500&auto=format&fit=crop",
      description: "Un cuento poético que viene acompañado de ilustraciones hechas con acuarelas por el propio autor."
    },
    {
      title: "Don Quijote de la Mancha",
      author: "Miguel de Cervantes",
      category: "Novela",
      imageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=500&auto=format&fit=crop",
      description: "La obra más destacada de la literatura española y una de las principales de la literatura universal."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-24">
      <Hero />

      <section className="px-4">
        <h2 className="text-3xl font-bold text-white mb-10 text-center font-mono tracking-tighter uppercase border-b border-gray-800 pb-4 max-w-md mx-auto">
          {'//'} NUESTRA GALERÍA
        </h2>
        <Carousel />
      </section>

      <section className="px-4">
        <h2 className="text-3xl font-bold text-white mb-10 text-center font-mono tracking-tighter uppercase border-b border-gray-800 pb-4 max-w-md mx-auto">
          {'//'} SOBRE NUESTRO SITIO
        </h2>
        <TerminalCard title="fastapi-server.py">
          <p className="text-green-400">INFO:     Started server process [3128]</p>
          <p className="text-green-400">INFO:     Waiting for application startup.</p>
          <p className="text-blue-400">INFO:     Application startup complete.</p>
          <p className="text-white mt-2">INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)</p>
          <p className="text-yellow-400 mt-4">API Routes loaded:</p>
          <p className="text-gray-300 pl-4">- GET /</p>
          <p className="text-gray-300 pl-4">- GET /test</p>
          <p className="text-white mt-4 animate-pulse">_</p>
        </TerminalCard>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 px-4 space-y-4 sm:space-y-0">
          <h2 className="text-3xl font-bold text-white font-mono tracking-tighter uppercase border-l-4 border-blue-600 pl-4">
            {'//'} LIBROS DESTACADOS
          </h2>
          <Button variant="outline">./ver_catalogo</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {mockBooks.map((book, index) => (
            <Card 
              key={index}
              title={book.title}
              author={book.author}
              category={book.category}
              imageUrl={book.imageUrl}
              description={book.description}
            />
          ))}
        </div>
      </section>

      <section className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center shadow-2xl mx-4">
        <h3 className="text-3xl font-bold text-white mb-6 font-mono tracking-tighter uppercase">
          ¿LISTO PARA EMPEZAR A LEER?
        </h3>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto text-lg leading-relaxed font-sans">
          Únete a nuestra comunidad de lectores hoy mismo y accede a miles de recursos educativos gratuitos. 
          Crea tu cuenta en segundos y lleva tu biblioteca personal a todas partes.
        </p>
        <div className="flex justify-center">
          <Button variant="primary" className="px-12 py-4 text-lg">./crear_cuenta_gratis</Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
