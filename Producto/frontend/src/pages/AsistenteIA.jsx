import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User, Wifi, WifiOff } from 'lucide-react';
import { buildIaWebSocketUrl } from '../api/ia';

const createSessionId = (userId) => {
  const random = Math.random().toString(36).slice(2, 10);
  return `sesion-${userId}-${random}`;
};

const DEFAULT_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Hola, soy tu asistente literario. Puedo recomendar libros, ayudarte a buscar títulos y orientarte según tu interés de lectura.',
  },
];

const AsistenteIA = () => {
  const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
  const storageKey = useMemo(() => `ia_session_${sbUser?.id || 'anon'}`, [sbUser?.id]);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!sbUser?.id) {
      return undefined;
    }

    const storedSessionId = localStorage.getItem(storageKey) || createSessionId(sbUser.id);
    localStorage.setItem(storageKey, storedSessionId);
    setSessionId(storedSessionId);
    const historyKey = `${storageKey}_${storedSessionId}_messages`;
    const storedMessages = JSON.parse(localStorage.getItem(historyKey) || 'null');
    setMessages(Array.isArray(storedMessages) && storedMessages.length > 0 ? storedMessages : DEFAULT_MESSAGES);

    const token = localStorage.getItem('sb_access_token') || localStorage.getItem('token');
    const socket = new WebSocket(
      buildIaWebSocketUrl(sbUser.id, {
        sesion_id: storedSessionId,
        token,
      })
    );

    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnecting(false);
      setIsConnected(true);
    };

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
      setIsConnecting(false);
      setIsConnected(false);
      setIsSending(false);
    };

    socket.onclose = () => {
      setIsConnecting(false);
      setIsConnected(false);
      setIsSending(false);
    };

    return () => {
      socket.close();
    };
  }, [sbUser?.id, storageKey]);

  useEffect(() => {
    if (!sessionId) return;
    const historyKey = `${storageKey}_${sessionId}_messages`;
    localStorage.setItem(historyKey, JSON.stringify(messages));
  }, [messages, sessionId, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(trimmed);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      },
    ]);
    setInput('');
    setIsSending(true);
  };

  const handleNewSession = () => {
    if (!sbUser?.id) return;
    const nextSession = createSessionId(sbUser.id);
    localStorage.setItem(storageKey, nextSession);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-blue-500 flex items-center gap-3">
              <Sparkles className="w-8 h-8" /> ASISTENTE_IA
            </h1>
            <p className="text-gray-500 text-sm mt-2">Canal en tiempo real por WebSocket con el recomendador literario_</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
              isConnected ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isConnecting ? 'CONECTANDO' : isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
            <button
              type="button"
              onClick={handleNewSession}
              className="px-4 py-2 rounded-xl border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5"
            >
              NUEVA_SESIÓN
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">SESIÓN_ACTIVA</p>
              <p className="text-[10px] text-gray-500 uppercase break-all">{sessionId || 'generando...'}</p>
            </div>
            {isSending && (
              <div className="text-[10px] text-yellow-300 uppercase tracking-widest flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando respuesta
              </div>
            )}
          </div>

          <div className="h-[520px] overflow-y-auto p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 border ${
                    message.role === 'user'
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-50'
                      : 'bg-gray-950/80 border-gray-800 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest">
                    {message.role === 'user' ? <User className="w-4 h-4 text-blue-300" /> : <Bot className="w-4 h-4 text-purple-300" />}
                    {message.role === 'user' ? 'TÚ' : 'ASISTENTE'}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-800 bg-black/20">
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                rows="3"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta por recomendaciones, autores o disponibilidad..."
                className="flex-1 bg-black/40 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-blue-500 resize-none"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || isSending || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 min-w-[160px]"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ENVIAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AsistenteIA;
