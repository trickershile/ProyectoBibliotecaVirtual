import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Wifi, WifiOff } from 'lucide-react';
import iconoChatbot from '../public/icono-chatbot.png';
import { buildIaWebSocketUrl } from '../api/ia';

const DEFAULT_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte?',
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sb_user'));
  } catch {
    return null;
  }
};

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sbUser, setSbUser] = useState(getStoredUser);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleAuthChange = () => setSbUser(getStoredUser());
    window.addEventListener('sb_user_updated', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('sb_user_updated', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const connect = useCallback(() => {
    const user = getStoredUser();
    if (!user?.id) return;

    const token = localStorage.getItem('sb_access_token') || localStorage.getItem('token');
    const socket = new WebSocket(
      buildIaWebSocketUrl(user.id, { token })
    );

    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: String(event.data),
        },
      ]);
      setIsSending(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
      setIsSending(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setIsSending(false);
    };
  }, []);

  useEffect(() => {
    socketRef.current?.close();
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [sbUser?.id, connect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(trimmed);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', content: trimmed },
    ]);
    setInput('');
    setIsSending(true);
  };

  const toggleChat = () => setIsOpen(!isOpen);

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

        {/* Status */}
        <div className={`flex items-center justify-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-center ${isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Conectado' : sbUser?.id ? 'Desconectado' : 'Inicia sesión para chatear'}
        </div>

        {/* Messages */}
        <div className="flex-grow p-3 space-y-3 overflow-y-auto bg-[#121212]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2 text-xs max-w-xs flex gap-1.5 ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white'}`}>
                {msg.role === 'user' ? (
                  <User className="w-3 h-3 mt-0.5 shrink-0" />
                ) : (
                  <Bot className="w-3 h-3 mt-0.5 shrink-0" />
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-2 bg-[#1e1e1e] border-t-2 border-gray-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={!sbUser?.id ? 'Inicia sesión para chatear' : isConnected ? 'Escribe tu mensaje...' : 'Conectando...'} 
              disabled={!isConnected || isSending}
              className="flex-1 bg-black text-white p-2 text-xs border-2 border-t-gray-800 border-l-gray-800 border-r-gray-300 border-b-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || isSending || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 border-2 border-t-purple-400 border-l-purple-400 border-r-purple-800 border-b-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <span className="text-xs">...</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
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
