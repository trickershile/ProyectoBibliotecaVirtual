import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Card = ({ title, description, category, author, imageUrl }) => {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border-2 border-[#aa7f5d] bg-[#fffaf4] shadow-[0_18px_38px_rgba(95,69,47,0.16)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(95,69,47,0.2)]">
      {/* Terminal Tools Section */}
      <div className="flex items-center border-b-2 border-[#d2b08f] bg-[#ead4bd] px-4 py-2">
        <BookOpen className="h-3.5 w-3.5 text-[#7f5c40]" />
      </div>

      {/* Book Image Section */}
      <div className="relative h-48 overflow-hidden border-b-2 border-[#d2b08f]">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=500&auto=format&fit=crop"} 
          alt={title}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4f372877] to-transparent opacity-80"></div>
      </div>

      {/* Card Content */}
      <div className="flex flex-grow flex-col p-5 font-mono text-sm">
        <div className="mb-3">
          <span className="font-bold text-[#7f5c40]">{category}</span>
        </div>
        
        <h3 className="mb-2 line-clamp-1 text-lg font-bold text-[#4b3525]">
          {title}
        </h3>
        
        <p className="mb-6 flex-grow line-clamp-3 text-xs leading-relaxed text-[#5f4633]">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[#d2b08f] pt-4 text-[10px]">
          <span className="text-[#5f4633]">
            <span className="text-[#9d7553]">Autor:</span> {author}
          </span>
          <Link
            to="/catalogo"
            className="inline-flex items-center rounded-md border-2 border-[#9d7553] bg-[#f8ede2] px-3 py-1 text-[#5a3f2b] transition-colors duration-300 hover:border-[#7f5c40] hover:bg-[#d8bb9e] hover:text-[#3f2b1d]"
          >
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Card;
