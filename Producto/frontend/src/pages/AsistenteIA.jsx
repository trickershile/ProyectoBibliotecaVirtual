import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User, Wifi, WifiOff } from 'lucide-react';
import { buildIaWebSocketUrl } from '../api/ia';
import { statusStyles, theme } from '../lib/theme';

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
    <div className={theme.pageShell}>
      <div className={theme.compactContainer}>
        <div className={`${theme.pageHeader} flex flex-col justify-between gap-4 lg:flex-row lg:items-center`}>
          <div>
            <h1 className={theme.pageTitleRow}>
              <Sparkles className="w-8 h-8" /> Asistente IA
            </h1>
            <p className={theme.pageSubtitle}>Canal en tiempo real con el recomendador literario.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
              isConnected ? statusStyles.success : statusStyles.danger
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isConnecting ? 'Conectando' : isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <button
              type="button"
              onClick={handleNewSession}
              className={theme.outlineButton}
            >
              Nueva sesión
            </button>
          </div>
        </div>

        <div className={`${theme.sectionCard} overflow-hidden p-0`}>
          <div className="flex items-center justify-between gap-3 border-b-2 border-[#d2b08f] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7f5c40]">Sesión activa</p>
              <p className="break-all text-[10px] uppercase text-[#9d7553]">{sessionId || 'generando...'}</p>
            </div>
            {isSending && (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8a633f]">
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando respuesta
              </div>
            )}
          </div>

          <div className="h-[min(520px,calc(100vh-20rem))] min-h-[320px] overflow-y-auto p-5 space-y-4 sm:h-[min(520px,calc(100vh-18rem))]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 border ${
                    message.role === 'user'
                      ? 'border-[#9faf92] bg-[#eef4e8] text-[#4f5f49]'
                      : 'border-[#d2b08f] bg-[#f8ede2] text-[#5a3f2b]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest">
                    {message.role === 'user' ? <User className="w-4 h-4 text-[#566b4a]" /> : <Bot className="w-4 h-4 text-[#8f6443]" />}
                    {message.role === 'user' ? 'Tú' : 'Asistente'}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t-2 border-[#d2b08f] bg-[#f3e4d4] p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                rows="3"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta por recomendaciones, autores o disponibilidad..."
                className={`flex-1 ${theme.textarea}`}
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || isSending || !input.trim()}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white md:min-w-[160px] md:w-auto ${theme.primaryButton} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AsistenteIA;
