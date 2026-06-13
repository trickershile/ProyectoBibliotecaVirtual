import { Link } from 'react-router-dom';

const Card = ({ title, description, category, author, imageUrl }) => {
  return (
    <div className="bg-[#0f1724] rounded-xl overflow-hidden shadow-xl border border-[#2a3650] flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-2xl group">
      {/* Terminal Tools Section */}
      <div className="flex items-center space-x-2 bg-[#151c2b] px-4 py-3 border-b border-[#2a3650]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffadad]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffd6a5]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#b9fbc0]"></div>
        <span className="text-[#aab3c2] text-[10px] font-mono ml-2 uppercase tracking-tighter">previsualizar_libro.sh</span>
      </div>

      {/* Book Image Section */}
      <div className="relative h-48 overflow-hidden border-b border-[#2a3650]">
        <img 
          src={imageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=500&auto=format&fit=crop"} 
          alt={title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1724] to-transparent opacity-80"></div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow font-mono text-sm">
        <div className="mb-3">
          <span className="text-[#a7d8ff] font-bold">[{category}]</span>
        </div>
        
        <h3 className="text-[#e7e6f4] font-bold text-lg mb-2 line-clamp-1">
          <span className="text-[#b9fbc0] mr-2">$</span>{title}
        </h3>
        
        <p className="text-[#aab3c2] mb-6 flex-grow line-clamp-3 leading-relaxed text-xs">
          {description}
        </p>

        <div className="pt-4 border-t border-[#2a3650] flex items-center justify-between mt-auto text-[10px]">
          <span className="text-[#ffd6a5]">autor: "{author}"</span>
          <Link to="/catalogo" className="text-[#a7d8ff] hover:text-white transition-colors underline decoration-dotted">
            ./abrir
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Card;
