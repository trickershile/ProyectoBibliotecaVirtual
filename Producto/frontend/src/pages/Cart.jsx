import { useState, useEffect } from 'react';
import Button from '../components/Button';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(savedCart);
  }, []);

  const removeItem = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    // Disparar evento para que el Navbar se actualice
    window.dispatchEvent(new Event('storage'));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-mono">
      <div className="border-b border-gray-800 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">
          {'>'} MI_CARRITO_DE_COMPRAS
        </h1>
        <p className="text-gray-400 mt-2">Gestión de activos literarios para adquisición_</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-800">
          <p className="text-gray-500">[!] EL_CARRITO_ESTÁ_VACÍO</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-800">
                  <th className="px-6 py-4">ACTIVO_LITERARIO</th>
                  <th className="px-6 py-4">CATEGORÍA</th>
                  <th className="px-6 py-4 text-right">PRECIO</th>
                  <th className="px-6 py-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">{item.title}</div>
                      <div className="text-gray-500 text-xs">{item.author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-bold">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-400 text-[10px] uppercase font-bold transition-colors"
                      >
                        [ELIMINAR]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900/50 border border-gray-800 rounded-2xl p-6 gap-6">
            <div className="space-y-1">
              <span className="text-gray-500 text-[10px] uppercase block tracking-widest">RESUMEN_DE_TRANSACCIÓN</span>
              <div className="text-2xl font-bold text-white">
                TOTAL: <span className="text-green-500">${calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="primary" className="flex-1 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                ./finalizar_pedido
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-[11px] text-blue-400 leading-relaxed">
            <span className="font-bold mr-2">[INFO]:</span> 
            Los libros adquiridos estarán disponibles para retiro en la sucursal seleccionada 
            dentro de las próximas 24 horas hábiles tras confirmar el pago.
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
