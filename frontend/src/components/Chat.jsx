import { useState } from 'react';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-mono">
      {/* Chat Window */}
      <div 
        className={`w-80 h-96 bg-[#1e1e1e] border-4 border-t-gray-300 border-l-gray-300 border-r-gray-800 border-b-gray-800 shadow-lg flex flex-col transition-all duration-300 ease-out transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-purple-700 text-white p-2 relative flex items-center justify-center">
          <div className="absolute left-2 flex items-center">
            {/* Robot Icon from Image */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 100 100" 
              className="text-white"
            >
              {/* Antenna */}
              <rect x="48" y="10" width="4" height="15" fill="black" />
              <path d="M40 12 Q50 0 60 12" fill="none" stroke="#df00ff" strokeWidth="4" />
              
              {/* Side Panels (Purple) */}
              <rect x="10" y="40" width="12" height="25" rx="2" fill="#df00ff" stroke="black" strokeWidth="2" />
              <rect x="78" y="40" width="12" height="25" rx="2" fill="#df00ff" stroke="black" strokeWidth="2" />
              
              {/* Head */}
              <rect x="22" y="25" width="56" height="45" rx="4" fill="white" stroke="black" strokeWidth="4" />
              
              {/* Eyes */}
              <circle cx="38" cy="42" r="4" fill="black" />
              <circle cx="62" cy="42" r="4" fill="black" />
              
              {/* Purple mouth line */}
              <path d="M30 58 L70 58 L65 64 L35 64 Z" fill="#df00ff" stroke="black" strokeWidth="1" />
              
              {/* Base */}
              <rect x="15" y="75" width="70" height="15" rx="2" fill="white" stroke="black" strokeWidth="4" />
            </svg>
          </div>
          <h2 className="text-sm font-bold ml-6 uppercase tracking-tighter">AYUDA_SISTEMA</h2>
          <button 
            onClick={toggleChat} 
            className="absolute right-2 w-5 h-5 bg-red-500 border-2 border-t-red-300 border-l-red-300 border-r-red-800 border-b-red-800 text-white flex items-center justify-center font-bold text-xs"
          >
            X
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-3 space-y-3 overflow-y-auto bg-[#121212]">
          <div className="flex">
            <div className="bg-gray-700 text-white p-2 text-xs max-w-xs">
              <p>Hola, soy el asistente virtual. ¿En qué puedo ayudarte?</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-purple-600 text-white p-2 text-xs max-w-xs">
              <p>Tengo una pregunta sobre un libro.</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-2 bg-[#1e1e1e] border-t-2 border-gray-800">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            className="w-full bg-black text-white p-2 text-xs border-2 border-t-gray-800 border-l-gray-800 border-r-gray-300 border-b-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button 
        onClick={toggleChat} 
        className={`mt-4 w-16 h-16 bg-purple-600 border-4 border-t-purple-400 border-l-purple-400 border-r-purple-800 border-b-purple-800 text-white flex items-center justify-center shadow-lg transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
        <svg 
          width="45" 
          height="40" 
          viewBox="0 0 100 100" 
        >
          {/* Antenna */}
          <rect x="48" y="10" width="4" height="15" fill="black" />
          <path d="M40 12 Q50 0 60 12" fill="none" stroke="#df00ff" strokeWidth="4" />
          
          {/* Side Panels (Purple) */}
          <rect x="10" y="40" width="12" height="25" rx="2" fill="#df00ff" stroke="black" strokeWidth="2" />
          <rect x="78" y="40" width="12" height="25" rx="2" fill="#df00ff" stroke="black" strokeWidth="2" />
          
          {/* Head */}
          <rect x="22" y="25" width="56" height="45" rx="4" fill="white" stroke="black" strokeWidth="4" />
          
          {/* Eyes */}
          <circle cx="38" cy="42" r="4" fill="black" />
          <circle cx="62" cy="42" r="4" fill="black" />
          
          {/* Purple mouth line */}
          <path d="M30 58 L70 58 L65 64 L35 64 Z" fill="#df00ff" stroke="black" strokeWidth="1" />
          
          {/* Base */}
          <rect x="15" y="75" width="70" height="15" rx="2" fill="white" stroke="black" strokeWidth="4" />
        </svg>
      </button>
    </div>
  );
};

export default Chat;
