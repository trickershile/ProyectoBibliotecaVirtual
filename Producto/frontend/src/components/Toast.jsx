import { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const Toast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleToast = (e) => {
      setMessage(e.detail.message);
      setVisible(true);
      
      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-900 border border-blue-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[300px]">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-grow">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">SISTEMA_NOTIFICACIÓN</p>
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
