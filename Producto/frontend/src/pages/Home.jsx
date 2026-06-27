import Hero from '../components/Hero';
import Card from '../components/Card';
import Button from '../components/Button';
import Carousel from '../components/Carousel';

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
    <div className="mx-auto w-full max-w-7xl space-y-24 bg-[#e7d4bf] px-4 py-10 text-[#4b3525] sm:px-6 lg:px-8">
      <Hero />

      {/* RECOMENDACIONES IA */}
      <section className="px-4">
        <h2 className="mx-auto mb-10 max-w-md border-b-2 border-[#b9926d] pb-4 text-center font-mono text-3xl font-bold uppercase tracking-tighter text-[#6a4a33]">
          LA COMUNIDAD DE LOS LECTORES
        </h2>
        <Carousel />
      </section>

      {/* LISTAS TOP SELECCIONADAS */}
      <section className="px-4">
        <h2 className="mx-auto mb-10 max-w-md border-b-2 border-[#b9926d] pb-4 text-center font-mono text-3xl font-bold uppercase tracking-tighter text-[#6a4a33]">
          LISTAS TOP SELECCIONADAS
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Thriller */}
          <div className="group rounded-3xl border-2 border-[#b9926d] bg-[#fffaf4] p-8 shadow-[0_18px_44px_rgba(95,69,47,0.16)] transition-all hover:border-[#9d7553]">
            <h3 className="mb-6 flex items-center gap-3 font-mono text-xl font-bold text-[#5a3f2b]">
              LOS 5 MEJORES PARA EL THRILLER
            </h3>
            <div className="space-y-4">
              {['El Psicoanalista', 'Reina Roja', 'El Silencio de los Corderos', 'Perdida', 'La Paciente Silenciosa'].map((book, i) => (
                <div key={i} className="flex items-center gap-4 text-[#6f523c] transition-colors group-hover:text-[#4b3525]">
                  <span className="text-[10px] font-mono text-[#9d7553]">0{i+1}.</span>
                  <span className="text-sm font-medium">{book}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t-2 border-[#d2b08f] pt-6">
              <Button variant="outline" className="w-full border-[#9d7553] bg-[#f8ede2] text-[10px] text-[#5a3f2b] hover:border-[#7f5c40] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]">Acceder al thriller</Button>
            </div>
          </div>

          {/* Top Clásicos */}
          <div className="group rounded-3xl border-2 border-[#b9926d] bg-[#fffaf4] p-8 shadow-[0_18px_44px_rgba(95,69,47,0.16)] transition-all hover:border-[#9d7553]">
            <h3 className="mb-6 flex items-center gap-3 font-mono text-xl font-bold text-[#5a3f2b]">
              CLÁSICOS QUE NO SON ABURRIDOS
            </h3>
            <div className="space-y-4">
              {['1984', 'Crónica de una muerte anunciada', 'El Retrato de Dorian Gray', 'Rebelión en la Granja', 'El Gran Gatsby'].map((book, i) => (
                <div key={i} className="flex items-center gap-4 text-[#6f523c] transition-colors group-hover:text-[#4b3525]">
                  <span className="text-[10px] font-mono text-[#9d7553]">0{i+1}.</span>
                  <span className="text-sm font-medium">{book}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t-2 border-[#d2b08f] pt-6">
              <Button variant="outline" className="w-full border-[#9d7553] bg-[#f8ede2] text-[10px] text-[#5a3f2b] hover:border-[#7f5c40] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]">Explorar clásicos</Button>
            </div>
          </div>
        </div>
      </section>

      {/* NOVEDADES DEL SISTEMA */}
      <section className="px-4">
        <h2 className="mx-auto mb-10 max-w-md border-b-2 border-[#b9926d] pb-4 text-center font-mono text-3xl font-bold uppercase tracking-tighter text-[#6a4a33]">
          NOVEDADES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative overflow-hidden rounded-2xl border-2 border-[#b9926d] bg-[#fffaf4] p-6 shadow-[0_16px_36px_rgba(95,69,47,0.16)]">
            <div className="absolute top-0 right-0 bg-[#8f6443] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#fffaf5]">Nuevo ingreso</div>
            <h3 className="mb-2 font-mono text-xl font-bold text-[#5a3f2b]">SISTEMAS OPERATIVOS 2026</h3>
            <p className="mb-4 text-sm text-[#6f523c]">Actualización crítica del archivo sobre arquitecturas modernas y kernels distribuidos.</p>
            <Button variant="outline" className="border-[#9d7553] bg-[#f8ede2] py-1 text-xs text-[#5a3f2b] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]">Ver detalles</Button>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border-2 border-[#b9926d] bg-[#fffaf4] p-6 shadow-[0_16px_36px_rgba(95,69,47,0.16)]">
            <div className="absolute top-0 right-0 bg-[#d8bb9e] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4b3525]">Destacado mes</div>
            <h3 className="mb-2 font-mono text-xl font-bold text-[#5a3f2b]">IA GENERATIVA EN MAIPÚ</h3>
            <p className="mb-4 text-sm text-[#6f523c]">Análisis local sobre el impacto de la inteligencia artificial en el desarrollo comunal.</p>
            <Button variant="outline" className="border-[#9d7553] bg-[#f8ede2] py-1 text-xs text-[#5a3f2b] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]">Ver detalles</Button>
          </div>
        </div>
      </section>

      {/* LIBROS DESTACADOS */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 px-4 space-y-4 sm:space-y-0">
          <h2 className="border-l-4 border-[#8f6443] pl-4 font-mono text-3xl font-bold uppercase tracking-tighter text-[#5a3f2b]">
            LIBROS DESTACADOS
          </h2>
          <Button variant="outline" className="border-[#9d7553] bg-[#f8ede2] text-[#5a3f2b] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]" to="/catalogo">Ver catalogo</Button>
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

      {/* CALL TO ACTION FINAL */}
      <section className="mx-4 rounded-3xl border-2 border-[#9faf92] bg-[#eef4e8] p-12 text-center shadow-[0_20px_48px_rgba(79,95,73,0.16)]">
        <h3 className="mb-6 font-mono text-3xl font-bold uppercase tracking-tighter text-[#5a3f2b]">
          ¿LISTO PARA EMPEZAR A LEER?
        </h3>
        <p className="mx-auto mb-12 max-w-2xl font-sans text-lg leading-relaxed text-[#4f5f49]">
          Únete a nuestra comunidad de lectores hoy mismo y accede a miles de recursos educativos gratuitos. 
          Crea tu cuenta en segundos y lleva tu biblioteca personal a todas partes.
        </p>
        <div className="flex justify-center">
          <Button variant="primary" className="border-[#6f8a60] bg-[#6f8a60] px-12 py-4 text-lg text-[#fffaf5] hover:bg-[#566b4a] hover:text-[#fffaf5]" to="/register">Crear cuenta gratis</Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
