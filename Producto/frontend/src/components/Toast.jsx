import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const Toast = () => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const hideTimerRef = useRef(null);
  const unmountTimerRef = useRef(null);

  useEffect(() => {
    const handleToast = (e) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
      }

      setMessage(e.detail.message);
      setMounted(true);

      requestAnimationFrame(() => {
        setVisible(true);
      });

      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 3000);

      unmountTimerRef.current = setTimeout(() => {
        setMounted(false);
      }, 3300);
    };

    window.addEventListener('show-toast', handleToast);

    return () => {
      window.removeEventListener('show-toast', handleToast);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] w-[calc(100vw-2rem)] max-w-sm transition-all duration-300 ease-out sm:bottom-6 sm:right-6 ${
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-2 scale-95 opacity-0'
      }`}
    >
      <div className="flex items-start gap-4 rounded-2xl border border-blue-500/50 bg-gray-900 p-4 shadow-2xl">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-grow">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">Notificación</p>
          <p className="text-xs text-white font-mono">{message}</p>
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="text-gray-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
