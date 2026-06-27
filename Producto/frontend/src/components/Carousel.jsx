import { useState, useEffect } from 'react';

const Carousel = () => {
  const images = [
    {
      url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop",
      title: "Explora nuestra Biblioteca",
      description: "Miles de libros a tu alcance en un solo lugar."
    },
    {
      url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop",
      title: "Recursos Educativos",
      description: "Aprende con los mejores materiales de estudio."
    },
    {
      url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop",
      title: "Comunidad de Lectores",
      description: "Comparte y descubre nuevas lecturas con otros."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="group relative mx-auto h-[400px] w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-[#aa7f5d] shadow-[0_22px_52px_rgba(95,69,47,0.18)] md:h-[500px]">
      {/* Slides */}
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#2f2118]/70 via-[#6a4c38]/35 to-[#fff7ee1a] p-6">
            <div className="max-w-3xl rounded-3xl border border-[#f0dfcf]/70 bg-[#fff7ee]/88 px-6 py-8 text-center text-[#3f2b1d] shadow-[0_18px_40px_rgba(47,33,24,0.25)] backdrop-blur-sm md:px-10">
              <h2 className="mb-4 text-3xl font-bold leading-tight drop-shadow-[0_2px_10px_rgba(255,247,238,0.35)] md:text-5xl">{image.title}</h2>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-[#4b3525] md:text-xl">{image.description}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[#9d7553] bg-[#fff7ee]/92 p-3 text-[#5a3f2b] opacity-0 backdrop-blur-sm transition-all hover:bg-[#ead4bd] group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[#9d7553] bg-[#fff7ee]/92 p-3 text-[#5a3f2b] opacity-0 backdrop-blur-sm transition-all hover:bg-[#ead4bd] group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'scale-125 bg-[#7f5c40]' : 'bg-[#f8ede2] border border-[#9d7553]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
