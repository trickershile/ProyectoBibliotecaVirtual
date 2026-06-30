import { useState, useEffect } from 'react';

const terminalLogs = [
  { text: "INFO:     Conexión establecida con Nodo Central Maipú.", color: "text-green-400" },
  { text: "INFO:     Sincronizando inventario de sedes físicas...", color: "text-green-400" },
  { text: "ESTADO:   Sistemas en línea y disponibles para público.", color: "text-blue-400", mt: true },
  
  { text: "[CATÁLOGO] Resumen de Existencias Digitales:", color: "text-purple-400", mt: true },
  { text: "➔ Textos de Química y Farmacia ... [ACTUALIZADO]", color: "text-gray-400", indent: true },
  { text: "➔ Material Clínico de Apoyo ..... [DISPONIBLE]", color: "text-gray-400", indent: true },
  { text: "➔ Catálogo de Literatura General .. [COMPLETO]", color: "text-gray-400", indent: true },

  { text: "[SERVICIOS] Disponibilidad de Módulos:", color: "text-yellow-500", mt: true },
  { text: "✔ Carrito de Compras y Pedidos .... OPERATIVO", color: "text-gray-300", indent: true },
  { text: "✔ Descarga Segura de Previews ...... HABILITADA", color: "text-gray-300", indent: true },
  { text: "✔ Asesor Virtual con IA ........... EN LÍNEA", color: "text-gray-300", indent: true },
  { text: "✔ Módulo de Reseñas y Comunidad ... ACTIVO", color: "text-gray-300", indent: true },
  
  { text: "Nota: Las descargas de libros completos requieren inicio de sesión y validación de préstamo activo.", color: "text-gray-500", mt: true, isNote: true }
];

const AnimatedTerminal = () => {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineText, setCurrentLineText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    // Si todavía quedan líneas por escribir
    if (lineIndex < terminalLogs.length) {
      const currentFullText = terminalLogs[lineIndex].text;

      // Si aún faltan caracteres por escribir en la línea actual
      if (charIndex < currentFullText.length) {
        const charTimeout = setTimeout(() => {
          setCurrentLineText((prev) => prev + currentFullText[charIndex]);
          setCharIndex((prev) => prev + 1);
        }, 15); // Velocidad del tipeo por letra (15ms por caracter). Puedes subirlo a 30ms si lo quieres más lento.

        return () => clearTimeout(charTimeout);
      } else {
        // La línea actual terminó de escribirse letra por letra. 
        // La consolidamos en el arreglo de líneas completadas y pasamos a la siguiente.
        const lineDelay = setTimeout(() => {
          setDisplayedLines((prev) => [...prev, { ...terminalLogs[lineIndex], text: currentFullText }]);
          setCurrentLineText("");
          setCharIndex(0);
          setLineIndex((prev) => prev + 1);
        }, 150); // Pausa de 150ms al terminar la línea antes de saltar a la otra

        return () => clearTimeout(lineDelay);
      }
    } else {
      // BUCLE: Cuando todo el reporte está impreso en pantalla, espera 8 segundos y reinicia de cero
      const loopTimeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineText("");
        setLineIndex(0);
        setCharIndex(0);
      }, 8000);

      return () => clearTimeout(loopTimeout);
    }
  }, [lineIndex, charIndex]);

  return (
    <div className="w-full bg-black/90 border border-gray-800 rounded-lg p-6 font-mono text-sm shadow-2xl text-left select-none">
      {/* Barra superior de la ventana de comandos */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
        </div>
        <span className="text-xs text-gray-500 font-mono">sistema_biblioteca_virtual.log</span>
        <div className="w-10"></div>
      </div>

      {/* Contenedor principal de logs */}
      <div className="min-h-[380px] flex flex-col justify-between">
        <div>
          {/* 1. Renderiza las líneas que ya terminaron de tipearse */}
          {displayedLines.map((line, i) => (
            <p 
              key={i} 
              className={`${line.color} ${line.mt ? 'mt-4' : ''} ${line.indent ? 'pl-4' : ''} ${line.isNote ? 'text-xs' : ''}`}
            >
              {line.text}
            </p>
          ))}

          {/* 2. Renderiza la línea que se está escribiendo letra por letra en este instante */}
          {lineIndex < terminalLogs.length && (
            <p 
              className={`${terminalLogs[lineIndex].color} ${terminalLogs[lineIndex].mt ? 'mt-4' : ''} ${terminalLogs[lineIndex].indent ? 'pl-4' : ''} ${terminalLogs[lineIndex].isNote ? 'text-xs' : ''}`}
            >
              {currentLineText}
              <span className="animate-pulse font-bold text-white">|</span>
            </p>
          )}
        </div>

        {/* Cursor de comandos final fijo (Prompt) */}
        <p className="text-white mt-6 font-mono">
          lectura_viva@maipu_digital:~$ <span className="inline-block w-2 h-4 bg-white animate-pulse align-middle"></span>
        </p>
      </div>
    </div>
  );
};

export default AnimatedTerminal;