import { useState } from 'react';
import iconoChatbot from '../public/icono-chatbot.png';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono sm:bottom-5 sm:right-5">
      {/* Chat Window */}
      <div 
        className={`absolute bottom-full right-0 mb-3 flex h-[min(26rem,calc(100vh-7rem))] w-[min(20rem,calc(100vw-1rem))] flex-col bg-[#1e1e1e] shadow-lg border-4 border-t-gray-300 border-l-gray-300 border-r-gray-800 border-b-gray-800 transition-all duration-300 ease-out origin-bottom-right transform ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-purple-700 text-white p-2 relative flex items-center justify-center">
          <div className="absolute left-2 flex items-center">
            <img
              src={iconoChatbot}
              alt="Asistente"
              className="h-6 w-6 object-contain"
            />
          </div>
          <h2 className="ml-6 text-sm font-bold uppercase tracking-tighter">Ayuda del sistema</h2>
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
        className={`flex h-14 w-14 items-center justify-center border-4 border-t-[#d7c5b3] border-l-[#d7c5b3] border-r-[#1f1f1f] border-b-[#1f1f1f] bg-[#2f3b4a] text-white shadow-lg transition-all duration-300 sm:h-16 sm:w-16 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        <img
          src={iconoChatbot}
          alt="Abrir asistente"
          className="h-11 w-11 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:h-[3.1rem] sm:w-[3.1rem]"
        />
      </button>
    </div>
  );
};

export default Chat;
