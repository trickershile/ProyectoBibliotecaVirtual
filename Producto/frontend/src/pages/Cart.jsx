import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, ArrowRight, CreditCard, Clock, Info, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { withApiOrigin } from '../lib/supabase';
import { checkoutCart, getCart, removeCartItem } from '../lib/cart';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const items = await getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] No se pudo cargar el carrito_' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId) => {
    const updatedCart = await removeCartItem(cartItemId);
    setCartItems(updatedCart);
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: `Ejemplar removido del sistema_` } 
    }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const handleConfirmOrder = async () => {
    setSubmittingOrder(true);
    let checkoutResponse = null;
    let paymentIntent = null;
    try {
      const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
      if (!sbUser) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: "[!] Debes iniciar sesión para confirmar el pedido_" } 
        }));
        return;
      }

      checkoutResponse = await checkoutCart('retiro_biblioteca');
      paymentIntent = await paymentsApi.createIntent({
        orden_id: checkoutResponse.orden_id,
        monto: checkoutResponse.total_pagado,
        metodo_pago: paymentMethod,
      }, sbUser.id);
      const confirmedPayment = await paymentsApi.confirm(paymentIntent.id);
      const order = await ordersApi.getById(checkoutResponse.orden_id);
      setOrderSuccess({
        ...order,
        _id: order._id || checkoutResponse.orden_id,
        total_amount: order.total_amount || checkoutResponse.total_pagado,
        payment: confirmedPayment,
      });
      setCartItems([]);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Pago confirmado y orden registrada correctamente_' }
      }));

    } catch (error) {
      console.error("Error al procesar pedido:", error);
      if (checkoutResponse?.orden_id) {
        try {
          const order = await ordersApi.getById(checkoutResponse.orden_id);
          setOrderSuccess({
            ...order,
            _id: order._id || checkoutResponse.orden_id,
            total_amount: order.total_amount || checkoutResponse.total_pagado,
            payment: paymentIntent
              ? {
                  ...paymentIntent,
                  estado: paymentIntent.estado || 'pendiente',
                }
              : null,
          });
          setCartItems([]);
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: '[!] La orden fue creada, pero el pago quedó pendiente de confirmación_' }
          }));
          return;
        } catch (recoveryError) {
          console.error('Error al recuperar la orden tras fallo de pago:', recoveryError);
        }
      }
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: "[!] Error al procesar el pago o confirmar el pedido_" } 
      }));
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (orderSuccess) {
    const paymentCompleted = orderSuccess.payment?.estado === 'pagado';
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono flex items-center justify-center">
        <div className={`max-w-2xl w-full bg-gray-900/50 rounded-3xl p-10 text-center space-y-8 shadow-2xl ${
          paymentCompleted ? 'border border-green-500/30' : 'border border-yellow-500/30'
        }`}>
          <div className="relative mx-auto w-24 h-24">
            <CheckCircle2 className={`w-24 h-24 ${paymentCompleted ? 'text-green-500' : 'text-yellow-500'}`} />
            <div className={`absolute inset-0 blur-2xl rounded-full ${paymentCompleted ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}></div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {paymentCompleted ? '¡PAGO CONFIRMADO!' : 'ORDEN CREADA, PAGO PENDIENTE'}
            </h2>
            <p className="text-gray-400 text-sm">
              Tu solicitud #{orderSuccess._id} {paymentCompleted ? 'ha sido procesada exitosamente.' : 'quedó registrada y espera validación de pago.'}
            </p>
            {orderSuccess.payment && (
              <p className={`text-xs uppercase tracking-widest font-bold ${paymentCompleted ? 'text-emerald-300' : 'text-yellow-300'}`}>
                Pago {orderSuccess.payment.estado} por ${(orderSuccess.payment.monto || 0).toLocaleString('es-CL')} vía {orderSuccess.payment.metodo_pago}
              </p>
            )}
          </div>

          <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">COMPROBANTE_DIGITAL</p>
              <p className="text-xs text-gray-300">
                {orderSuccess.receipt_url
                  ? 'Descarga tu recibo para el retiro en sede_'
                  : 'La orden quedó registrada y podrás seguir su estado desde tu perfil_'}
              </p>
            </div>
            {orderSuccess.receipt_url ? (
              <a 
                href={withApiOrigin(orderSuccess.receipt_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-white text-black font-black text-[10px] rounded-xl hover:bg-blue-500 hover:text-white transition-all uppercase tracking-widest shadow-xl"
              >
                <Download className="w-4 h-4" />
                DESCARGAR_PDF
              </a>
            ) : (
              <div className="px-6 py-3 bg-blue-500/10 text-blue-300 font-black text-[10px] rounded-xl border border-blue-500/20 uppercase tracking-widest">
                ORDEN_REGISTRADA
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-800">
            <Link to="/catalogo" className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <ArrowRight className="w-3 h-3 rotate-180" /> VOLVER_AL_CATÁLOGO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-blue-500 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" /> {'>'} CARRITO_DE_COMPRAS
          </h1>
          <p className="text-gray-400 mt-2">Revisión de ejemplares seleccionados para adquisición institucional_</p>
        </div>

        {loading ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/10 space-y-6">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">CARGANDO_CARRITO_BACKEND_</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/10 space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <ShoppingCart className="w-20 h-20 text-gray-800" />
              <div className="absolute top-0 right-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <span className="text-red-500 text-[10px] font-bold">0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">[!] EL_CARRITO_ESTÁ_VACÍO</p>
              <p className="text-gray-600 text-[10px]">No se han detectado registros de libros en tu sesión actual.</p>
            </div>
            <Link 
              to="/catalogo" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              Ir al catálogo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">ACTIVOS_LITERARIOS ({cartItems.length})</span>
                  <span className="text-[9px] text-blue-400 font-bold">ID_SESIÓN: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id || item._id || item.id} className="p-4 flex gap-4 group hover:bg-white/5 transition-all">
                      <div className="w-16 h-20 bg-black rounded-lg overflow-hidden border border-gray-800 flex-shrink-0">
                        <img 
                          src={item.image_url ? withApiOrigin(item.image_url) : "https://via.placeholder.com/150x200?text=BOOK"} 
                          alt={item.title} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-white truncate uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{item.title}</h3>
                            <p className="text-[10px] text-gray-500 italic mt-0.5">Autor: {item.author}</p>
                            <p className="text-[9px] text-gray-600 font-bold mt-1">Cantidad: {item.quantity || 1}</p>
                          </div>
                          <button 
                            onClick={() => removeItem(item.cart_item_id)}
                            className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Remover activo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold rounded border border-blue-500/20 uppercase">
                            {(item.categories && item.categories[0]) || 'General'}
                          </span>
                          <span className="text-sm font-black text-white">
                            ${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AVISO_SISTEMA</p>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Los libros serán reservados por un periodo máximo de 48 horas. La entrega se realizará en la sede especificada para cada ejemplar tras la validación de la transacción.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-6 sticky top-24 shadow-2xl">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] border-b border-gray-800 pb-3">RESUMEN_ORDEN</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">SUBTOTAL_LIBROS</span>
                    <span className="text-white font-bold">${calculateTotal().toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">CARGOS_SERVICIO</span>
                    <span className="text-green-500 font-bold">$0 (GRATIS)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">SEDES_INVOLUCRADAS</span>
                    <span className="text-blue-400 font-bold">{new Set(cartItems.map(i => i.pickup_location)).size}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">MÉTODO_DE_PAGO</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'tarjeta'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-gray-800 bg-black/30 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Tarjeta de débito/crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'transferencia'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-gray-800 bg-black/30 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Transferencia bancaria
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('presencial')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'presencial'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-gray-800 bg-black/30 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      Pago presencial en retiro
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">TOTAL_A_PAGAR</span>
                    <span className="text-2xl font-black text-white leading-none">
                      ${calculateTotal().toLocaleString('es-CL')}
                    </span>
                  </div>

                  <button 
                    onClick={handleConfirmOrder}
                    disabled={submittingOrder}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:scale-[1.02]"
                  >
                    {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    PAGAR_Y_CONFIRMAR_PEDIDO
                  </button>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                    <Clock className="w-3 h-3" />
                    Procesamiento asíncrono seguro_
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
