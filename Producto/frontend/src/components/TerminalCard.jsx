const TerminalCard = ({ children, title = "terminal.exe" }) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      {/* Tools Section (Browser-like buttons) */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-inner"></div>
        </div>
        <div className="text-gray-400 text-xs font-mono">
          {title}
        </div>
        <div className="w-12"></div> {/* Spacer to center title */}
      </div>

      {/* Card Content */}
      <div className="p-6 text-gray-300 font-mono text-sm leading-relaxed overflow-x-auto">
        {children || (
          <div className="space-y-2">
            <p className="text-green-400">$ npm install fullstack-app</p>
            <p className="text-blue-400">... Installing dependencies</p>
            <p className="text-yellow-400">... Configuring Tailwind CSS</p>
            <p className="text-gray-400">... Done in 2.4s</p>
            <p className="text-white mt-4 animate-pulse">_</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalCard;
