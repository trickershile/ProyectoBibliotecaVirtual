import { useEffect } from 'react';
import { X } from 'lucide-react';

const blockKeys = new Set(['s', 'p', 'u', 'i', 'j']);

const VisorDigital = ({ url, onClose, title = 'Lector digital' }) => {
  useEffect(() => {
    const onContextMenu = (e) => {
      e.preventDefault();
    };

    const onKeyDown = (e) => {
      const key = String(e.key || '').toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && blockKeys.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col">
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="text-white font-mono text-xs font-black uppercase tracking-widest">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all"
          aria-label="Cerrar visor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3">
        <div className="h-full w-full bg-black border border-gray-800 rounded-2xl overflow-hidden">
          <iframe
            src={url}
            title="Visor digital"
            className="w-full h-full"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    </div>
  );
};

export default VisorDigital;
